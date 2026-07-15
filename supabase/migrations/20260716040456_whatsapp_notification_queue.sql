-- Decouple end-of-game WhatsApp notification delivery from the client's
-- browser tab staying open. Previously, sends were driven directly from
-- the client (either one request per player, or later one batch request);
-- both are vulnerable to the tab being closed/killed right as the game is
-- completed, which silently drops any messages not yet dispatched.
--
-- New flow: client inserts one row per recipient into
-- whatsapp_notification_queue as part of completing the game (a fast,
-- synchronous DB write — same reliability class as the games/shared_links
-- writes that already complete reliably). A trigger fires an async HTTP
-- call to the process-whatsapp-queue Edge Function immediately after
-- insert; a pg_cron sweep every 2 minutes acts as a backstop in case that
-- immediate call is missed for any reason. Delivery no longer depends on
-- anything happening in the browser after the insert succeeds.

CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE public.whatsapp_notification_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
    phone_number TEXT NOT NULL,
    message_text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ
);

CREATE INDEX whatsapp_notification_queue_status_idx
    ON public.whatsapp_notification_queue (status, created_at);

ALTER TABLE public.whatsapp_notification_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can queue notifications for their own games"
ON public.whatsapp_notification_queue
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.user_id = auth.uid())
);

CREATE POLICY "Users can view notifications for their own games"
ON public.whatsapp_notification_queue
FOR SELECT TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.games g WHERE g.id = game_id AND g.user_id = auth.uid())
);

-- Atomically claims a batch of pending rows for processing so two
-- concurrent triggers (the immediate one + the cron sweep) can't double
-- send. SECURITY DEFINER + restricted grant: only the Edge Function
-- (using the service role) may call this.
CREATE OR REPLACE FUNCTION public.claim_pending_whatsapp_notifications(batch_size INT DEFAULT 50)
RETURNS SETOF public.whatsapp_notification_queue
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    UPDATE public.whatsapp_notification_queue
    SET status = 'processing'
    WHERE id IN (
        SELECT id FROM public.whatsapp_notification_queue
        WHERE status = 'pending'
        ORDER BY created_at
        LIMIT batch_size
        FOR UPDATE SKIP LOCKED
    )
    RETURNING *;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_whatsapp_notifications(INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_pending_whatsapp_notifications(INT) TO service_role;

-- Fire-and-forget: ask the Edge Function to process the queue right away.
-- The x-queue-secret header is a shared secret (not a user JWT — there is
-- no user in a DB trigger context) verified by the function itself, read
-- from Supabase Vault rather than embedded in this function's source; the
-- pg_cron sweep below is the safety net if this call is ever missed.
-- The secret itself is provisioned separately via:
--   select vault.create_secret('<value>', 'queue_trigger_secret', '...');
-- and set as the process-whatsapp-queue function's QUEUE_TRIGGER_SECRET
-- env var (`supabase secrets set`) — never committed to this repo.
CREATE OR REPLACE FUNCTION public.trigger_process_whatsapp_queue()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
    secret TEXT;
BEGIN
    SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets
    WHERE name = 'queue_trigger_secret';

    PERFORM net.http_post(
        url := 'https://xfahfllkbutljcowwxpx.supabase.co/functions/v1/process-whatsapp-queue',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-queue-secret', secret
        ),
        body := '{}'::jsonb
    );
    RETURN NULL;
END;
$$;

CREATE TRIGGER on_whatsapp_notification_queued
AFTER INSERT ON public.whatsapp_notification_queue
FOR EACH STATEMENT
EXECUTE FUNCTION public.trigger_process_whatsapp_queue();

-- Backstop sweep in case the trigger's HTTP call is ever dropped.
SELECT cron.schedule(
    'process-whatsapp-queue-sweep',
    '*/2 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://xfahfllkbutljcowwxpx.supabase.co/functions/v1/process-whatsapp-queue',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-queue-secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'queue_trigger_secret')
        ),
        body := '{}'::jsonb
    );
    $$
);
