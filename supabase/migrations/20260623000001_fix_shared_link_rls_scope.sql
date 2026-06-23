-- Revert owner-centric shared-access SELECT policies back to resource-scoped ones.
-- The "Owner or Token Access" policies from 20260204120000 used get_shared_link_owner()
-- which exposed ALL data by the owner to any token holder.
-- Replace with is_valid_game_link / is_valid_player_link so each token only
-- grants access to the specific resource it was created for.
-- Write policies (INSERT/UPDATE/DELETE) are unchanged.

-- GAMES ---------------------------------------------------------------
DROP POLICY IF EXISTS "Owner or Token Access" ON public.games;

CREATE POLICY "Owner or Token Access" ON public.games
FOR SELECT TO anon, authenticated
USING (
  auth.uid() = user_id
  OR public.is_valid_game_link(
       (current_setting('request.headers', true)::json ->> 'x-share-token'), id)
  OR public.can_view_game_via_player_link(
       (current_setting('request.headers', true)::json ->> 'x-share-token'), id)
);

-- PLAYERS -------------------------------------------------------------
DROP POLICY IF EXISTS "Owner or Token Access" ON public.players;
DROP POLICY IF EXISTS "Authenticated users and shared links can view players" ON public.players;

CREATE POLICY "Owner or Token Access" ON public.players
FOR SELECT TO anon, authenticated
USING (
  auth.uid() = user_id
  OR public.is_valid_player_link(
       (current_setting('request.headers', true)::json ->> 'x-share-token'), id)
  OR public.can_view_player_in_game_context(
       (current_setting('request.headers', true)::json ->> 'x-share-token'), id)
);

-- GAME_PLAYERS --------------------------------------------------------
DROP POLICY IF EXISTS "Owner or Token Access" ON public.game_players;
DROP POLICY IF EXISTS "Authenticated users and shared links can view game_players" ON public.game_players;

CREATE POLICY "Owner or Token Access" ON public.game_players
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_players.game_id AND g.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = game_players.game_id
      AND public.is_valid_game_link(
            (current_setting('request.headers', true)::json ->> 'x-share-token'), g.id)
  )
  OR public.is_valid_player_link(
       (current_setting('request.headers', true)::json ->> 'x-share-token'),
       game_players.player_id)
);

-- BUY_IN_HISTORY ------------------------------------------------------
DROP POLICY IF EXISTS "Owner or Token Access" ON public.buy_in_history;
DROP POLICY IF EXISTS "Authenticated users and shared links can view buy_in_history" ON public.buy_in_history;

CREATE POLICY "Owner or Token Access" ON public.buy_in_history
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id AND g.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
      AND public.is_valid_game_link(
            (current_setting('request.headers', true)::json ->> 'x-share-token'), g.id)
  )
  OR EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.id = buy_in_history.game_player_id
      AND public.is_valid_player_link(
            (current_setting('request.headers', true)::json ->> 'x-share-token'), gp.player_id)
  )
);

-- TABLE_POSITIONS -----------------------------------------------------
DROP POLICY IF EXISTS "Owner or Token Access" ON public.table_positions;
DROP POLICY IF EXISTS "Authenticated users and shared links can view table_positions" ON public.table_positions;

CREATE POLICY "Owner or Token Access" ON public.table_positions
FOR SELECT TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = table_positions.game_id AND g.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.games g
    WHERE g.id = table_positions.game_id
      AND public.is_valid_game_link(
            (current_setting('request.headers', true)::json ->> 'x-share-token'), g.id)
  )
);
