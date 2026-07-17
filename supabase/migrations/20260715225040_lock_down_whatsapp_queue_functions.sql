-- REVOKE ALL ... FROM PUBLIC did not actually restrict access: this
-- project's public schema has default privileges that grant EXECUTE
-- directly to the anon/authenticated roles (not via PUBLIC membership),
-- so revoking from PUBLIC alone left both roles able to call
-- claim_pending_whatsapp_notifications via PostgREST RPC — leaking other
-- users' phone numbers and message text, and letting anyone hijack queued
-- rows so the real processor never sends them. Revoke from the actual
-- roles explicitly.

REVOKE ALL ON FUNCTION public.claim_pending_whatsapp_notifications(INT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_whatsapp_notifications(INT) TO service_role;

REVOKE ALL ON FUNCTION public.trigger_process_whatsapp_queue() FROM PUBLIC, anon, authenticated;
