-- Add access_token to shared_links table
ALTER TABLE public.shared_links 
ADD COLUMN access_token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'base64');

-- Create index for faster token lookups
CREATE INDEX idx_shared_links_access_token ON public.shared_links(access_token);

-- Drop old RLS policies that depend on is_valid_share_token
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;

-- Now drop the old validation function
DROP FUNCTION IF EXISTS public.is_valid_share_token(text, uuid);

-- Drop old share_tokens table (no longer needed)
DROP TABLE IF EXISTS public.share_tokens CASCADE;

-- Create new validation function for game links
CREATE OR REPLACE FUNCTION public.is_valid_game_link(_token text, _game_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE access_token = _token
      AND resource_type = 'game'
      AND resource_id = _game_id
  )
$$;

-- Create new validation function for player links
CREATE OR REPLACE FUNCTION public.is_valid_player_link(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE access_token = _token
      AND resource_type = 'player'
      AND resource_id = _player_id
  )
$$;

-- Create function to check if token grants access to user's games (any valid link)
CREATE OR REPLACE FUNCTION public.has_any_valid_link(_token text, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE access_token = _token
      AND user_id = _user_id
  )
$$;

-- Create new RLS policy on games table
CREATE POLICY "Public can view games with valid share token"
  ON public.games
  FOR SELECT
  USING (
    has_any_valid_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      user_id
    )
  );

-- Create new RLS policy on game_players table
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
  );

-- Create new RLS policy on players table
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  USING (
    has_any_valid_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      user_id
    )
  );

-- Create new RLS policy on buy_in_history table
CREATE POLICY "Public can view buy-in history with valid share token"
  ON public.buy_in_history
  FOR SELECT
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

-- Create new RLS policy on table_positions table
CREATE POLICY "Public can view table positions with valid share token"
  ON public.table_positions
  FOR SELECT
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