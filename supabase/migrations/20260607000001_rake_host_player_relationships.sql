-- Feature: Rake + Host designation per game
ALTER TABLE public.games ADD COLUMN IF NOT EXISTS rake DECIMAL(8,2) DEFAULT 0;
ALTER TABLE public.game_players ADD COLUMN IF NOT EXISTS is_host BOOLEAN DEFAULT false;

-- Feature: Player relationships (preferred / avoid settlement partners)
CREATE TABLE IF NOT EXISTS public.player_relationships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  related_player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('preferred', 'avoid')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, player_id, related_player_id, relationship_type)
);

ALTER TABLE public.player_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own player relationships" ON public.player_relationships
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own player relationships" ON public.player_relationships
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own player relationships" ON public.player_relationships
  FOR DELETE USING (auth.uid() = user_id);
