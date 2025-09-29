-- Add user_id to existing tables to associate data with users
ALTER TABLE public.players ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.games ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies to filter by user_id
DROP POLICY IF EXISTS "Allow all operations on players" ON public.players;
DROP POLICY IF EXISTS "Allow all operations on games" ON public.players;
DROP POLICY IF EXISTS "Allow all operations on game_players" ON public.game_players;

-- Players policies - users can only access their own players
CREATE POLICY "Users can view their own players" ON public.players
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own players" ON public.players
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own players" ON public.players
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own players" ON public.players
  FOR DELETE USING (auth.uid() = user_id);

-- Games policies - users can only access their own games
CREATE POLICY "Users can view their own games" ON public.games
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own games" ON public.games
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own games" ON public.games
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own games" ON public.games
  FOR DELETE USING (auth.uid() = user_id);

-- Game players policies - users can only access game_players for their own games
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

-- Create profiles table for additional user info
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies - users can only view and update their own profile
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();