-- Create table for tracking poker table positions
CREATE TABLE public.table_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  snapshot_timestamp timestamp with time zone NOT NULL DEFAULT now(),
  positions jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for faster queries
CREATE INDEX idx_table_positions_game_id ON public.table_positions(game_id);
CREATE INDEX idx_table_positions_timestamp ON public.table_positions(snapshot_timestamp);

-- Enable RLS
ALTER TABLE public.table_positions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view positions for their games"
  ON public.table_positions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND games.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert positions for their games"
  ON public.table_positions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND games.user_id = auth.uid()
  ));

CREATE POLICY "Users can update positions for their games"
  ON public.table_positions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND games.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete positions for their games"
  ON public.table_positions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND games.user_id = auth.uid()
  ));