-- Fix RLS policies to allow unauthenticated users to view game details with valid tokens

-- Games table: Allow public viewing with any valid share token
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;
CREATE POLICY "Public can view games with valid share token"
  ON public.games
  FOR SELECT
  TO anon, authenticated
  USING (
    has_any_valid_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      user_id
    )
  );

-- Game_players table: Allow viewing when accessing via valid game link
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
CREATE POLICY "Public can view game_players with valid share token"
  ON public.game_players
  FOR SELECT
  TO anon, authenticated
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
  );

-- Players table: Allow viewing with valid player or game link
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Player-specific link for this exact player
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
    OR
    -- Any game link from this user (to show player names in game details)
    has_any_valid_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      user_id
    )
  );

-- Buy-in history: Allow viewing with valid game link
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;
CREATE POLICY "Public can view buy-in history with valid share token"
  ON public.buy_in_history
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM game_players gp
      JOIN games g ON g.id = gp.game_id
      WHERE gp.id = buy_in_history.game_player_id
        AND has_any_valid_link(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          g.user_id
        )
    )
  );

-- Table positions: Allow viewing with valid game link
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;
CREATE POLICY "Public can view table positions with valid share token"
  ON public.table_positions
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = table_positions.game_id
        AND has_any_valid_link(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          games.user_id
        )
    )
  );

-- Shared_links: Allow public viewing (needed for short code resolution)
DROP POLICY IF EXISTS "Public can view shared links" ON public.shared_links;
CREATE POLICY "Public can view shared links"
  ON public.shared_links
  FOR SELECT
  TO anon, authenticated
  USING (true);