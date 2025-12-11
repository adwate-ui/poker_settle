-- Fix shared link access control to match requirements:
-- 1. Game links: show game history only (no player details)
-- 2. Player links: show game history + specific player history only
-- 3. Authenticated users: can see all their own data through shared links

-- Ensure authenticated users can always access their own data
-- Update games policy to include authenticated user access
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;
CREATE POLICY "Public can view games with valid share token"
  ON public.games
  FOR SELECT
  USING (
    -- Authenticated users can always see their own games
    auth.uid() = user_id
    OR
    -- Or via valid share link
    has_any_valid_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      user_id
    )
  );

-- Update players policy to include authenticated user access
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  USING (
    -- Authenticated users can always see their own players
    auth.uid() = user_id
    OR
    -- Or via player-specific share link
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
  );

-- Update game_players policy to include authenticated user access and player-specific links
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
CREATE POLICY "Public can view game_players with valid share token"
  ON public.game_players
  FOR SELECT
  USING (
    -- Authenticated users can see game_players for their own games
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = game_players.game_id
        AND games.user_id = auth.uid()
    )
    OR
    -- Or via any valid link for game details
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
    -- Or via player-specific link for this player's game history
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      game_players.player_id
    )
  );

-- Update buy_in_history policy to include authenticated user access
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;
CREATE POLICY "Public can view buy-in history with valid share token"
  ON public.buy_in_history
  FOR SELECT
  USING (
    -- Authenticated users can see buy-in history for their own games
    EXISTS (
      SELECT 1
      FROM game_players gp
      JOIN games g ON g.id = gp.game_id
      WHERE gp.id = buy_in_history.game_player_id
        AND g.user_id = auth.uid()
    )
    OR
    -- Or via valid share link
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

-- Update table_positions policy to include authenticated user access
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;
CREATE POLICY "Public can view table positions with valid share token"
  ON public.table_positions
  FOR SELECT
  USING (
    -- Authenticated users can see table positions for their own games
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = table_positions.game_id
        AND games.user_id = auth.uid()
    )
    OR
    -- Or via valid share link
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
