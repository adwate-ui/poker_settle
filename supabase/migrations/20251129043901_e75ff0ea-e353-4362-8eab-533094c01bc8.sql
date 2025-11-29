-- Add public read access to share_tokens
-- This is needed so short links can be resolved by unauthenticated users
-- The tokens are already public (used in URLs), so this doesn't expose new information
CREATE POLICY "Public can view share tokens"
  ON public.share_tokens
  FOR SELECT
  USING (true);