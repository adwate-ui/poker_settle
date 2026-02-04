-- 1. Create Helper RPC to get Owner ID from Token
CREATE OR REPLACE FUNCTION get_shared_link_owner(_token text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT user_id
  FROM shared_links
  WHERE access_token = _token
  LIMIT 1;
$$;

-- 2. Revoke Old Policies

-- Games
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;
DROP POLICY IF EXISTS "Authenticated users and shared links can view games" ON public.games;

-- Players
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;

-- Game Players
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;

-- Buy In History
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;

-- Table Positions
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;

-- 3. Create Unified Owner-Centric Policies

-- Policy for Games: Allow if owner or token owner matches game owner
CREATE POLICY "Owner or Token Access" ON public.games
FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  user_id = get_shared_link_owner(current_setting('request.headers', true)::json->>'x-share-token')
);

-- Policy for Players: Allow if owner or token owner matches player owner
CREATE POLICY "Owner or Token Access" ON public.players
FOR SELECT
USING (
  user_id = auth.uid() 
  OR 
  user_id = get_shared_link_owner(current_setting('request.headers', true)::json->>'x-share-token')
);

-- Policy for Game Players: Allow if game owner matches
CREATE POLICY "Owner or Token Access" ON public.game_players
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_players.game_id
    AND (
      games.user_id = auth.uid() 
      OR 
      games.user_id = get_shared_link_owner(current_setting('request.headers', true)::json->>'x-share-token')
    )
  )
);

-- Policy for Buy In History: Access via game_player -> game
CREATE POLICY "Owner or Token Access" ON public.buy_in_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1 
    FROM public.game_players gp
    JOIN public.games g ON gp.game_id = g.id
    WHERE gp.id = buy_in_history.game_player_id
    AND (
      g.user_id = auth.uid() 
      OR 
      g.user_id = get_shared_link_owner(current_setting('request.headers', true)::json->>'x-share-token')
    )
  )
);

-- Policy for Table Positions: Access via game
CREATE POLICY "Owner or Token Access" ON public.table_positions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND (
      games.user_id = auth.uid() 
      OR 
      games.user_id = get_shared_link_owner(current_setting('request.headers', true)::json->>'x-share-token')
    )
  )
);
