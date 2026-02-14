-- 20260214103000_apply_rls_fix.sql
-- Safe incremental migration to apply RLS fixes to an existing database

-- 1. Add user_id column if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'user_id') THEN
        ALTER TABLE public.players ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'games' AND column_name = 'user_id') THEN
        ALTER TABLE public.games ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 2. Drop potential existing policies (secure and insecure variants)
DROP POLICY IF EXISTS "Allow all operations on players" ON public.players;
-- Note: There was a typo in the original migration where "Allow all operations on games" was on public.players
DROP POLICY IF EXISTS "Allow all operations on games" ON public.players;
DROP POLICY IF EXISTS "Allow all operations on games" ON public.games;
DROP POLICY IF EXISTS "Allow all operations on game_players" ON public.game_players;

-- Drop secure policies if they already exist to ensure clean recreation
DROP POLICY IF EXISTS "Users can view their own players" ON public.players;
DROP POLICY IF EXISTS "Users can create their own players" ON public.players;
DROP POLICY IF EXISTS "Users can update their own players" ON public.players;
DROP POLICY IF EXISTS "Users can delete their own players" ON public.players;

DROP POLICY IF EXISTS "Users can view their own games" ON public.games;
DROP POLICY IF EXISTS "Users can create their own games" ON public.games;
DROP POLICY IF EXISTS "Users can update their own games" ON public.games;
DROP POLICY IF EXISTS "Users can delete their own games" ON public.games;

DROP POLICY IF EXISTS "Users can view game_players for their games" ON public.game_players;
DROP POLICY IF EXISTS "Users can create game_players for their games" ON public.game_players;
DROP POLICY IF EXISTS "Users can update game_players for their games" ON public.game_players;
DROP POLICY IF EXISTS "Users can delete game_players for their games" ON public.game_players;

-- 3. Re-create secure policies

-- Players policies
CREATE POLICY "Users can view their own players" ON public.players
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own players" ON public.players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" ON public.players
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" ON public.players
  FOR DELETE USING (auth.uid() = user_id);

-- Games policies
CREATE POLICY "Users can view their own games" ON public.games
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own games" ON public.games
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games" ON public.games
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games" ON public.games
  FOR DELETE USING (auth.uid() = user_id);

-- Game players policies
CREATE POLICY "Users can view game_players for their games" ON public.game_players
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.games 
      WHERE games.id = game_players.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create game_players for their games" ON public.game_players
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.games 
      WHERE games.id = game_players.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update game_players for their games" ON public.game_players
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.games 
      WHERE games.id = game_players.game_id 
      AND games.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete game_players for their games" ON public.game_players
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.games 
      WHERE games.id = game_players.game_id 
      AND games.user_id = auth.uid()
    )
  );
