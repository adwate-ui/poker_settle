-- Fix RLS policies to ensure authenticated users can access their data
-- This migration drops conflicting/incomplete policies and recreates them
-- to explicitly allow authenticated access OR valid shared link access.

-- Games
DROP POLICY IF EXISTS "Users can view their own games" ON public.games;
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;

CREATE POLICY "Authenticated users and shared links can view games"
ON public.games
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR
  has_any_valid_link(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    user_id
  )
);

-- Players
DROP POLICY IF EXISTS "Users can view their own players" ON public.players;
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;

CREATE POLICY "Authenticated users and shared links can view players"
ON public.players
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR
  can_view_player(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
  OR
  can_view_player_in_game_context(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
);

-- Game Players
DROP POLICY IF EXISTS "Users can view game_players for their games" ON public.game_players;
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;

CREATE POLICY "Authenticated users and shared links can view game_players"
ON public.game_players
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_players.game_id
    AND (
      games.user_id = auth.uid()
      OR
      has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        games.user_id
      )
    )
  )
  OR
  -- Allow viewing if specific player link exists (for that player's history)
  can_view_player(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    game_players.player_id
  )
);

-- Buy In History
DROP POLICY IF EXISTS "Users can view buy_in_history for their games" ON public.buy_in_history;
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;

CREATE POLICY "Authenticated users and shared links can view buy_in_history"
ON public.buy_in_history
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND (
      g.user_id = auth.uid()
      OR
      has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        g.user_id
      )
    )
  )
  OR
  -- Allow viewing if specific player link exists (for that player's history)
  EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.id = buy_in_history.game_player_id
    AND can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      gp.player_id
    )
  )
);

-- Table Positions
DROP POLICY IF EXISTS "Users can view table_positions for their games" ON public.table_positions;
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;

CREATE POLICY "Authenticated users and shared links can view table_positions"
ON public.table_positions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND (
      games.user_id = auth.uid()
      OR
      has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        games.user_id
      )
    )
  )
);
