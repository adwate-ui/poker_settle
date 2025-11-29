-- Update players table RLS policy to restrict access
-- Game links should NOT grant access to player detail pages
-- Only player-specific links should grant access to individual player records

DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  TO anon, authenticated
  USING (
    -- ONLY allow access with player-specific link for this exact player
    -- Game links should NOT grant access to player detail pages
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
  );