-- Create function to check if token grants access to a specific player
CREATE OR REPLACE FUNCTION public.can_view_player(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Allow if there's a player-specific link for this player
  -- OR if there's ANY game link for the user who owns this player
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links sl
    WHERE sl.access_token = _token
      AND (
        -- Player-specific link for this exact player
        (sl.resource_type = 'player' AND sl.resource_id = _player_id)
        OR
        -- Any game link from the user who owns this player
        (sl.resource_type = 'game' AND sl.user_id = (
          SELECT user_id FROM public.players WHERE id = _player_id
        ))
      )
  )
$$;

-- Update players table RLS policy to use the new function
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  USING (
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
  );

-- Ensure game_players can be viewed if player can be viewed
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
CREATE POLICY "Public can view game_players with valid share token"
  ON public.game_players
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = game_players.game_id
        AND has_any_valid_link(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          games.user_id
        )
    )
    OR
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      game_players.player_id
    )
  );