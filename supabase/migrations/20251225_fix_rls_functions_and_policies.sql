-- Migration to fix RLS functions and policies
-- This migration resolves the issue where authenticated users cannot see their data
-- because of missing helper functions in the previous policy definitions.

-- 1. Create Helper Functions for Token Validation

-- Function to check if a token matches a specific game
CREATE OR REPLACE FUNCTION public.is_valid_game_link(_token text, _game_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE resource_type = 'game'
      AND resource_id = _game_id
      AND access_token = _token
  );
$$;

-- Function to check if a token matches a specific player
CREATE OR REPLACE FUNCTION public.is_valid_player_link(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE resource_type = 'player'
      AND resource_id = _player_id
      AND access_token = _token
  );
$$;

-- Function to check if a token allows viewing a player in the context of a game
-- (e.g., if you have a game link, you should see the names of players in that game)
CREATE OR REPLACE FUNCTION public.can_view_player_in_game_context(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.player_id = _player_id
      AND public.is_valid_game_link(_token, g.id)
  );
$$;


-- 2. Update RLS Policies using the new functions

-- GAMES
DROP POLICY IF EXISTS "Authenticated users and shared links can view games" ON public.games;
DROP POLICY IF EXISTS "Users can view their own games" ON public.games;
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;

CREATE POLICY "Authenticated users and shared links can view games"
ON public.games
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR
  public.is_valid_game_link(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
);

-- PLAYERS
DROP POLICY IF EXISTS "Authenticated users and shared links can view players" ON public.players;
DROP POLICY IF EXISTS "Users can view their own players" ON public.players;
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;

CREATE POLICY "Authenticated users and shared links can view players"
ON public.players
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR
  public.is_valid_player_link(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
  OR
  public.can_view_player_in_game_context(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
);

-- GAME_PLAYERS
DROP POLICY IF EXISTS "Authenticated users and shared links can view game_players" ON public.game_players;
DROP POLICY IF EXISTS "Users can view game_players for their games" ON public.game_players;
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;

CREATE POLICY "Authenticated users and shared links can view game_players"
ON public.game_players
FOR SELECT
TO anon, authenticated
USING (
  -- Owner access
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_players.game_id
    AND games.user_id = auth.uid()
  )
  OR
  -- Shared Game Link access
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_players.game_id
    AND public.is_valid_game_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      games.id
    )
  )
  OR
  -- Shared Player Link access (view your history)
  public.is_valid_player_link(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    game_players.player_id
  )
);

-- BUY_IN_HISTORY
DROP POLICY IF EXISTS "Authenticated users and shared links can view buy_in_history" ON public.buy_in_history;
DROP POLICY IF EXISTS "Users can view buy_in_history for their games" ON public.buy_in_history;
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;

CREATE POLICY "Authenticated users and shared links can view buy_in_history"
ON public.buy_in_history
FOR SELECT
TO anon, authenticated
USING (
  -- Owner access
  EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND g.user_id = auth.uid()
  )
  OR
  -- Shared Game Link access
  EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND public.is_valid_game_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      g.id
    )
  )
  OR
  -- Shared Player Link access
  EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.id = buy_in_history.game_player_id
    AND public.is_valid_player_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      gp.player_id
    )
  )
);

-- TABLE_POSITIONS
DROP POLICY IF EXISTS "Authenticated users and shared links can view table_positions" ON public.table_positions;
DROP POLICY IF EXISTS "Users can view table_positions for their games" ON public.table_positions;
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;

CREATE POLICY "Authenticated users and shared links can view table_positions"
ON public.table_positions
FOR SELECT
TO anon, authenticated
USING (
  -- Owner access
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND games.user_id = auth.uid()
  )
  OR
  -- Shared Game Link access
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND public.is_valid_game_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      games.id
    )
  )
);
