-- Migration to allow viewing games via valid player share links
-- This fixes the issue where Shared Player Profile cannot fetch game history details (date, buy-in)
-- because the Games table RLS policy previously only allowed Game Links.

-- 1. Create Helper Function
CREATE OR REPLACE FUNCTION public.can_view_game_via_player_link(_token text, _game_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_players gp
    WHERE gp.game_id = _game_id
    AND public.is_valid_player_link(_token, gp.player_id)
  );
$$;

-- 2. Update Games Policy
DROP POLICY IF EXISTS "Authenticated users and shared links can view games" ON public.games;

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
  OR
  public.can_view_game_via_player_link(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
);
