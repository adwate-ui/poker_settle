-- A single game completion queued its full player batch twice, 28 seconds
-- apart (confirmed via created_at) — every player on that game received
-- their WhatsApp message twice. Each of the duplicate rows was claimed
-- and sent independently and correctly; claim_pending_whatsapp_notifications'
-- FOR UPDATE SKIP LOCKED worked exactly as designed. The gap is upstream:
-- nothing stopped the client from queueing the same (game, player) pair
-- more than once — whether from a double-tap race on the Complete Game
-- button, or two browser tabs/sessions completing the same game
-- independently (a client-side isCompletingGame flag can never protect
-- against the latter). Close this at the only layer that can actually
-- guarantee it: the database.

-- Drop the redundant duplicate, keeping the row that was queued first.
DELETE FROM public.whatsapp_notification_queue a
USING public.whatsapp_notification_queue b
WHERE a.game_id = b.game_id
  AND a.player_id = b.player_id
  AND a.created_at > b.created_at;

ALTER TABLE public.whatsapp_notification_queue
    ADD CONSTRAINT whatsapp_notification_queue_game_player_unique
    UNIQUE (game_id, player_id);
