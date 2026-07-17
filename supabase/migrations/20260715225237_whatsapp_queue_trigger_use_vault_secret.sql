-- Stop embedding the queue trigger secret as a literal in function source
-- (visible to anyone with pg_proc read access, and would otherwise end up
-- committed in plaintext in the migration history). Read it from Supabase
-- Vault instead, where it's stored encrypted.

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

SELECT cron.unschedule('process-whatsapp-queue-sweep');

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
