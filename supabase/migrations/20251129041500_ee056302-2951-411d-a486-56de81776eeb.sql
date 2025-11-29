-- Create share_tokens table for shareable read-only links
CREATE TABLE public.share_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.share_tokens ENABLE ROW LEVEL SECURITY;

-- Users can view their own token
CREATE POLICY "Users can view their own share token"
ON public.share_tokens
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own token
CREATE POLICY "Users can insert their own share token"
ON public.share_tokens
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own token (for regeneration)
CREATE POLICY "Users can update their own share token"
ON public.share_tokens
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own token
CREATE POLICY "Users can delete their own share token"
ON public.share_tokens
FOR DELETE
USING (auth.uid() = user_id);

-- Helper function to check if a share token is valid for a user_id
CREATE OR REPLACE FUNCTION public.is_valid_share_token(_token TEXT, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.share_tokens
    WHERE token = _token
      AND user_id = _user_id
  )
$$;

-- Add public SELECT policies for shareable data

-- Games: Allow public select with valid token
CREATE POLICY "Public can view games with valid share token"
ON public.games
FOR SELECT
TO anon
USING (public.is_valid_share_token(current_setting('request.headers', true)::json->>'x-share-token', user_id));

-- Game Players: Allow public select with valid token
CREATE POLICY "Public can view game_players with valid share token"
ON public.game_players
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1
  FROM public.games
  WHERE games.id = game_players.game_id
    AND public.is_valid_share_token(current_setting('request.headers', true)::json->>'x-share-token', games.user_id)
));

-- Players: Allow public select with valid token
CREATE POLICY "Public can view players with valid share token"
ON public.players
FOR SELECT
TO anon
USING (public.is_valid_share_token(current_setting('request.headers', true)::json->>'x-share-token', user_id));

-- Buy-in History: Allow public select with valid token
CREATE POLICY "Public can view buy-in history with valid share token"
ON public.buy_in_history
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1
  FROM game_players gp
  JOIN games g ON g.id = gp.game_id
  WHERE gp.id = buy_in_history.game_player_id
    AND public.is_valid_share_token(current_setting('request.headers', true)::json->>'x-share-token', g.user_id)
));

-- Table Positions: Allow public select with valid token
CREATE POLICY "Public can view table positions with valid share token"
ON public.table_positions
FOR SELECT
TO anon
USING (EXISTS (
  SELECT 1
  FROM games
  WHERE games.id = table_positions.game_id
    AND public.is_valid_share_token(current_setting('request.headers', true)::json->>'x-share-token', games.user_id)
));