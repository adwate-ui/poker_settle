-- Update function to restrict player viewing to player-specific links only
CREATE OR REPLACE FUNCTION public.can_view_player(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only allow if there's a player-specific link for this exact player
  -- Game links should NOT grant access to player details
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links sl
    WHERE sl.access_token = _token
      AND sl.resource_type = 'player' 
      AND sl.resource_id = _player_id
  )
$$;

-- Update players table RLS policy
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

-- Update game_players to only show data when viewing games, not individual player stats
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
CREATE POLICY "Public can view game_players with valid share token"
  ON public.game_players
  FOR SELECT
  USING (
    -- Can view if accessing via game link (for game details)
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = game_players.game_id
        AND has_any_valid_link(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          games.user_id
        )
    )
    -- Note: removed player-specific access here since players shouldn't see game_players
    -- They should only see their own player record via the players table
  );