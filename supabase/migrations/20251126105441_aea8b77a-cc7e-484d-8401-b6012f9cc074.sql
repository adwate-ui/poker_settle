-- Create buy_in_history table to track buy-in changes
CREATE TABLE public.buy_in_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_player_id UUID NOT NULL REFERENCES public.game_players(id) ON DELETE CASCADE,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  buy_ins_added INTEGER NOT NULL,
  total_buy_ins_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.buy_in_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can view buy-in history for their games
CREATE POLICY "Users can view buy-in history for their games"
ON public.buy_in_history
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND g.user_id = auth.uid()
  )
);

-- Users can insert buy-in history for their games
CREATE POLICY "Users can insert buy-in history for their games"
ON public.buy_in_history
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND g.user_id = auth.uid()
  )
);

-- Users can delete buy-in history for their games
CREATE POLICY "Users can delete buy-in history for their games"
ON public.buy_in_history
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND g.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX idx_buy_in_history_game_player ON public.buy_in_history(game_player_id);
CREATE INDEX idx_buy_in_history_timestamp ON public.buy_in_history(timestamp DESC);