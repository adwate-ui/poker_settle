-- Consolidated Migration File
-- Generated on 2026-02-11T11:40:45.349Z


-- ==================================================================
-- ORIGINAL MIGRATION: 20240523000000_add_chip_denominations.sql
-- ==================================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chip_denominations jsonb DEFAULT '[
    {"value": 5000, "color": "blue", "label": "5K", "rgb": [30, 64, 175]},
    {"value": 1000, "color": "white", "label": "1K", "rgb": [255, 255, 255]},
    {"value": 500, "color": "green", "label": "500", "rgb": [21, 128, 61]},
    {"value": 100, "color": "black", "label": "100", "rgb": [26, 26, 26]},
    {"value": 20, "color": "red", "label": "20", "rgb": [185, 28, 28]}
]'::jsonb;


-- ==================================================================
-- ORIGINAL MIGRATION: 20250925142923_dc2f6a39-659f-4d64-9b33-e9930f318c4a.sql
-- ==================================================================

-- Create players table to store persistent player data
CREATE TABLE public.players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL UNIQUE,
  total_games INTEGER DEFAULT 0,
  total_profit DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create games table to store game sessions
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  buy_in_amount DECIMAL(8,2) NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_players junction table for player performance in each game
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  buy_ins INTEGER NOT NULL DEFAULT 1,
  final_stack DECIMAL(10,2) DEFAULT 0,
  net_amount DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_id)
);

-- Enable Row Level Security
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

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

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_players_updated_at
BEFORE UPDATE ON public.players
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
BEFORE UPDATE ON public.games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_game_players_updated_at
BEFORE UPDATE ON public.game_players
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update player statistics
CREATE OR REPLACE FUNCTION public.update_player_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update player statistics when game_players record changes
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE public.players 
    SET 
      total_games = (
        SELECT COUNT(DISTINCT game_id) 
        FROM public.game_players 
        WHERE player_id = NEW.player_id
      ),
      total_profit = (
        SELECT COALESCE(SUM(net_amount), 0) 
        FROM public.game_players 
        WHERE player_id = NEW.player_id
      )
    WHERE id = NEW.player_id;
    RETURN NEW;
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    UPDATE public.players 
    SET 
      total_games = (
        SELECT COUNT(DISTINCT game_id) 
        FROM public.game_players 
        WHERE player_id = OLD.player_id
      ),
      total_profit = (
        SELECT COALESCE(SUM(net_amount), 0) 
        FROM public.game_players 
        WHERE player_id = OLD.player_id
      )
    WHERE id = OLD.player_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to automatically update player stats
CREATE TRIGGER update_player_statistics
AFTER INSERT OR UPDATE OR DELETE ON public.game_players
FOR EACH ROW
EXECUTE FUNCTION public.update_player_stats();

-- ==================================================================
-- ORIGINAL MIGRATION: 20250927005444_441edc83-f460-40c7-83d0-cd7f6dafb3fd.sql
-- ==================================================================

-- Add settlements column to games table to store calculated settlements
ALTER TABLE public.games 
ADD COLUMN settlements JSONB DEFAULT '[]'::jsonb;

-- ==================================================================
-- ORIGINAL MIGRATION: 20250929035938_fa6e59d6-a0c4-4537-b2fe-27bd85bc5a22.sql
-- ==================================================================



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

-- ==================================================================
-- ORIGINAL MIGRATION: 20250930010857_34d60d7a-ff88-47c9-86ba-790a5559fd30.sql
-- ==================================================================

-- Drop the existing unique constraint on name if it exists
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_name_key;

-- Add a composite unique constraint for user_id and name
-- This allows the same player name to exist for different users
ALTER TABLE public.players ADD CONSTRAINT players_user_id_name_key UNIQUE (user_id, name);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251027092533_5cef2764-bf74-4c46-bbe6-3c11d039163b.sql
-- ==================================================================



-- Add check constraints for data integrity
ALTER TABLE public.games
ADD CONSTRAINT games_buy_in_positive CHECK (buy_in_amount > 0);

ALTER TABLE public.game_players
ADD CONSTRAINT game_players_buy_ins_positive CHECK (buy_ins > 0),
ADD CONSTRAINT game_players_final_stack_non_negative CHECK (final_stack >= 0);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251027094649_672e4c79-b4d9-4203-b834-5ee72e82886b.sql
-- ==================================================================

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

-- ==================================================================
-- ORIGINAL MIGRATION: 20251027102754_90f4a086-e49c-45b5-b90b-48a4815f07b0.sql
-- ==================================================================

-- Create table for user API keys
CREATE TABLE public.user_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gemini_api_key TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can only view their own API keys
CREATE POLICY "Users can view their own API keys"
ON public.user_api_keys
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own API keys
CREATE POLICY "Users can insert their own API keys"
ON public.user_api_keys
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own API keys
CREATE POLICY "Users can update their own API keys"
ON public.user_api_keys
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own API keys
CREATE POLICY "Users can delete their own API keys"
ON public.user_api_keys
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_user_api_keys_updated_at
BEFORE UPDATE ON public.user_api_keys
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================================
-- ORIGINAL MIGRATION: 20251027144531_d428b2d5-582c-4c24-92a5-a2109a4a6cdd.sql
-- ==================================================================

-- Add blind configuration to games table
ALTER TABLE public.games
ADD COLUMN small_blind numeric DEFAULT 50,
ADD COLUMN big_blind numeric DEFAULT 100;

-- Create poker_hands table
CREATE TABLE public.poker_hands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  hand_number integer NOT NULL,
  button_player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  pot_size numeric DEFAULT 0,
  final_stage text CHECK (final_stage IN ('Preflop', 'Flop', 'Turn', 'River', 'Showdown')),
  winner_player_id uuid REFERENCES public.players(id) ON DELETE SET NULL,
  hero_position text,
  is_hero_win boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(game_id, hand_number)
);

-- Create street_cards table
CREATE TABLE public.street_cards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hand_id uuid NOT NULL REFERENCES public.poker_hands(id) ON DELETE CASCADE,
  street_type text NOT NULL CHECK (street_type IN ('Flop', 'Turn', 'River')),
  cards_notation text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create player_actions table
CREATE TABLE public.player_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  hand_id uuid NOT NULL REFERENCES public.poker_hands(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  street_type text NOT NULL CHECK (street_type IN ('Preflop', 'Flop', 'Turn', 'River')),
  action_sequence integer NOT NULL,
  action_type text NOT NULL CHECK (action_type IN ('Small Blind', 'Big Blind', 'Straddle', 'Re-Straddle', 'Check', 'Call', 'Raise', 'Fold', 'All-In')),
  bet_size numeric DEFAULT 0,
  is_hero boolean DEFAULT false,
  hole_cards text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.poker_hands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.street_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_actions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for poker_hands
CREATE POLICY "Users can view hands for their games"
ON public.poker_hands FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = poker_hands.game_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert hands for their games"
ON public.poker_hands FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = poker_hands.game_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update hands for their games"
ON public.poker_hands FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = poker_hands.game_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete hands for their games"
ON public.poker_hands FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = poker_hands.game_id
    AND games.user_id = auth.uid()
  )
);

-- RLS Policies for street_cards
CREATE POLICY "Users can view street cards for their hands"
ON public.street_cards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.poker_hands
    JOIN public.games ON games.id = poker_hands.game_id
    WHERE poker_hands.id = street_cards.hand_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert street cards for their hands"
ON public.street_cards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.poker_hands
    JOIN public.games ON games.id = poker_hands.game_id
    WHERE poker_hands.id = street_cards.hand_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update street cards for their hands"
ON public.street_cards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.poker_hands
    JOIN public.games ON games.id = poker_hands.game_id
    WHERE poker_hands.id = street_cards.hand_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete street cards for their hands"
ON public.street_cards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.poker_hands
    JOIN public.games ON games.id = poker_hands.game_id
    WHERE poker_hands.id = street_cards.hand_id
    AND games.user_id = auth.uid()
  )
);

-- RLS Policies for player_actions
CREATE POLICY "Users can view actions for their hands"
ON public.player_actions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.poker_hands
    JOIN public.games ON games.id = poker_hands.game_id
    WHERE poker_hands.id = player_actions.hand_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert actions for their hands"
ON public.player_actions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.poker_hands
    JOIN public.games ON games.id = poker_hands.game_id
    WHERE poker_hands.id = player_actions.hand_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update actions for their hands"
ON public.player_actions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.poker_hands
    JOIN public.games ON games.id = poker_hands.game_id
    WHERE poker_hands.id = player_actions.hand_id
    AND games.user_id = auth.uid()
  )
);

CREATE POLICY "Users can delete actions for their hands"
ON public.player_actions FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.poker_hands
    JOIN public.games ON games.id = poker_hands.game_id
    WHERE poker_hands.id = player_actions.hand_id
    AND games.user_id = auth.uid()
  )
);

-- Add indexes for performance
CREATE INDEX idx_poker_hands_game_id ON public.poker_hands(game_id);
CREATE INDEX idx_poker_hands_button_player ON public.poker_hands(button_player_id);
CREATE INDEX idx_street_cards_hand_id ON public.street_cards(hand_id);
CREATE INDEX idx_player_actions_hand_id ON public.player_actions(hand_id);
CREATE INDEX idx_player_actions_player_id ON public.player_actions(player_id);

-- Add trigger for updated_at on poker_hands
CREATE TRIGGER update_poker_hands_updated_at
BEFORE UPDATE ON public.poker_hands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ==================================================================
-- ORIGINAL MIGRATION: 20251027153059_e14f0181-ad67-4563-9392-63d38c6d4212.sql
-- ==================================================================

-- Add position column to player_actions table
ALTER TABLE player_actions ADD COLUMN IF NOT EXISTS position text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_player_actions_position ON player_actions(position);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251027160426_570c5db3-df13-42e9-ae0c-0189dfe04d7f.sql
-- ==================================================================

-- Add support for multiple winners (chopped pots)
-- Add winner_player_ids array to replace single winner_player_id
ALTER TABLE poker_hands 
ADD COLUMN winner_player_ids uuid[] DEFAULT '{}';

-- Create index for winner lookups
CREATE INDEX idx_poker_hands_winner_ids ON poker_hands USING GIN(winner_player_ids);

-- Migrate existing single winner data to array format
UPDATE poker_hands 
SET winner_player_ids = ARRAY[winner_player_id]::uuid[]
WHERE winner_player_id IS NOT NULL;

-- Keep winner_player_id for backward compatibility but it's now optional

-- ==================================================================
-- ORIGINAL MIGRATION: 20251029133810_79fdbb26-ba88-46b1-8551-27bc18f06082.sql
-- ==================================================================

-- Add positions column to poker_hands table to store table positions independently
ALTER TABLE public.poker_hands 
ADD COLUMN positions JSONB DEFAULT '[]'::jsonb;

-- ==================================================================
-- ORIGINAL MIGRATION: 20251029162201_7dafa08e-3d94-4a50-a7c3-aa32dd24ee16.sql
-- ==================================================================

-- Add is_split column to poker_hands table
ALTER TABLE public.poker_hands 
ADD COLUMN is_split boolean DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.poker_hands.is_split IS 'True when the pot is split between multiple players with identical hands';

-- ==================================================================
-- ORIGINAL MIGRATION: 20251126105441_aea8b77a-cc7e-484d-8401-b6012f9cc074.sql
-- ==================================================================

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

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129041500_ee056302-2951-411d-a486-56de81776eeb.sql
-- ==================================================================

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

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129043345_65b5595f-9cb9-42ec-9783-9ffebee3b0b0.sql
-- ==================================================================

-- Create shared_links table for short, shareable links
CREATE TABLE public.shared_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  short_code text NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  resource_type text NOT NULL CHECK (resource_type IN ('game', 'player')),
  resource_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT unique_user_resource UNIQUE (user_id, resource_type, resource_id)
);

-- Enable RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Users can create shared links for their own resources
CREATE POLICY "Users can create their own shared links"
  ON public.shared_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own shared links
CREATE POLICY "Users can view their own shared links"
  ON public.shared_links
  FOR SELECT
  USING (auth.uid() = user_id);

-- Public can view shared links (needed to resolve short codes)
CREATE POLICY "Public can view shared links"
  ON public.shared_links
  FOR SELECT
  USING (true);

-- Users can delete their own shared links
CREATE POLICY "Users can delete their own shared links"
  ON public.shared_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster short code lookups
CREATE INDEX idx_shared_links_short_code ON public.shared_links(short_code);
CREATE INDEX idx_shared_links_user_resource ON public.shared_links(user_id, resource_type, resource_id);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129043901_e75ff0ea-e353-4362-8eab-533094c01bc8.sql
-- ==================================================================

-- Add public read access to share_tokens
-- This is needed so short links can be resolved by unauthenticated users
-- The tokens are already public (used in URLs), so this doesn't expose new information
CREATE POLICY "Public can view share tokens"
  ON public.share_tokens
  FOR SELECT
  USING (true);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129045509_12c9efd8-124c-49fb-a913-05636ff2373d.sql
-- ==================================================================

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

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129045933_0acfcc0c-dd0c-4bc1-a32f-5b35e135adcb.sql
-- ==================================================================

-- Create function to check if token grants access to a specific player
CREATE OR REPLACE FUNCTION public.can_view_player(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Allow if there's a player-specific link for this player
  -- OR if there's ANY game link for the user who owns this player
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links sl
    WHERE sl.access_token = _token
      AND (
        -- Player-specific link for this exact player
        (sl.resource_type = 'player' AND sl.resource_id = _player_id)
        OR
        -- Any game link from the user who owns this player
        (sl.resource_type = 'game' AND sl.user_id = (
          SELECT user_id FROM public.players WHERE id = _player_id
        ))
      )
  )
$$;

-- Update players table RLS policy to use the new function
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  USING (
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
  );

-- Ensure game_players can be viewed if player can be viewed
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
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
    OR
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      game_players.player_id
    )
  );

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129050507_f2055e0e-23dd-4307-b775-1ed77a082728.sql
-- ==================================================================

-- Update function to restrict player viewing to player-specific links only
CREATE OR REPLACE FUNCTION public.can_view_player(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  -- Only allow if there's a player-specific link for this exact player
  -- Game links should NOT grant access to player details
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links sl
    WHERE sl.access_token = _token
      AND sl.resource_type = 'player' 
      AND sl.resource_id = _player_id
  )
$$;

-- Update players table RLS policy
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  USING (
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
  );

-- Update game_players to only show data when viewing games, not individual player stats
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
CREATE POLICY "Public can view game_players with valid share token"
  ON public.game_players
  FOR SELECT
  USING (
    -- Can view if accessing via game link (for game details)
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = game_players.game_id
        AND has_any_valid_link(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          games.user_id
        )
    )
    -- Note: removed player-specific access here since players shouldn't see game_players
    -- They should only see their own player record via the players table
  );

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129051353_2bbc5492-531b-497d-be75-69aea25ad536.sql
-- ==================================================================

-- Fix RLS policies to allow unauthenticated users to view game details with valid tokens

-- Games table: Allow public viewing with any valid share token
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;
CREATE POLICY "Public can view games with valid share token"
  ON public.games
  FOR SELECT
  TO anon, authenticated
  USING (
    has_any_valid_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      user_id
    )
  );

-- Game_players table: Allow viewing when accessing via valid game link
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
CREATE POLICY "Public can view game_players with valid share token"
  ON public.game_players
  FOR SELECT
  TO anon, authenticated
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

-- Players table: Allow viewing with valid player or game link
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Player-specific link for this exact player
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
    OR
    -- Any game link from this user (to show player names in game details)
    has_any_valid_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      user_id
    )
  );

-- Buy-in history: Allow viewing with valid game link
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;
CREATE POLICY "Public can view buy-in history with valid share token"
  ON public.buy_in_history
  FOR SELECT
  TO anon, authenticated
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

-- Table positions: Allow viewing with valid game link
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;
CREATE POLICY "Public can view table positions with valid share token"
  ON public.table_positions
  FOR SELECT
  TO anon, authenticated
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

-- Shared_links: Allow public viewing (needed for short code resolution)
DROP POLICY IF EXISTS "Public can view shared links" ON public.shared_links;
CREATE POLICY "Public can view shared links"
  ON public.shared_links
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129051931_0b84beec-0f9f-4280-b6a4-9a6ef9875bab.sql
-- ==================================================================

-- Update players table RLS policy to restrict access
-- Game links should NOT grant access to player detail pages
-- Only player-specific links should grant access to individual player records

DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  TO anon, authenticated
  USING (
    -- ONLY allow access with player-specific link for this exact player
    -- Game links should NOT grant access to player detail pages
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
  );

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129053852_70fb01e6-488f-47f5-8bef-d52ec90a9639.sql
-- ==================================================================

-- Create helper function to check if player is visible in game context
create or replace function public.can_view_player_in_game_context(_token text, _player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_players gp
    join public.games g on g.id = gp.game_id
    where gp.player_id = _player_id
      and public.has_any_valid_link(_token, g.user_id)
  );
$$;

-- Drop the existing public view policy
drop policy if exists "Public can view players with valid share token" on public.players;

-- Create updated policy that allows viewing players in game context
create policy "Public can view players with valid share token"
on public.players
for select
using (
  public.can_view_player(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
  or
  public.can_view_player_in_game_context(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129054630_122c6881-05ce-41db-88e0-8c3c0ae2eb04.sql
-- ==================================================================

-- Update can_view_player_in_game_context to only allow game links for players in that specific game
create or replace function public.can_view_player_in_game_context(_token text, _player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_players gp
    join public.games g on g.id = gp.game_id
    where gp.player_id = _player_id
      and public.is_valid_game_link(_token, g.id)
  );
$$;

-- ==================================================================
-- ORIGINAL MIGRATION: 20251129055744_77b68ad6-ea2b-44d7-a220-b11d122f4101.sql
-- ==================================================================

-- Update can_view_player_in_game_context to work with any valid link (game or player)
-- This allows showing player names in game views for both link types
create or replace function public.can_view_player_in_game_context(_token text, _player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.game_players gp
    join public.games g on g.id = gp.game_id
    where gp.player_id = _player_id
      and public.has_any_valid_link(_token, g.user_id)
  );
$$;

-- Update game_players policy to allow viewing for any valid link
drop policy if exists "Public can view game_players with valid share token" on public.game_players;
drop policy if exists "Public can view game_players only for linked player" on public.game_players;

create policy "Public can view game_players with valid share token"
on public.game_players
for select
using (
  exists (
    select 1
    from public.games g
    where g.id = game_players.game_id
      and public.has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        g.user_id
      )
  )
);

-- Update buy_in_history policy to allow viewing for any valid link
drop policy if exists "Public can view buy-in history with valid share token" on public.buy_in_history;

create policy "Public can view buy-in history with valid share token"
on public.buy_in_history
for select
using (
  exists (
    select 1
    from public.game_players gp
    join public.games g on g.id = gp.game_id
    where gp.id = buy_in_history.game_player_id
      and public.has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        g.user_id
      )
  )
);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251130043538_cc0fdf2c-40cd-4952-802b-47e5fff0b1e0.sql
-- ==================================================================

-- Add theme column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme text NOT NULL DEFAULT 'default' 
CHECK (theme IN ('default', 'one_piece', 'bleach', 'naruto', 'dandadan'));

-- ==================================================================
-- ORIGINAL MIGRATION: 20251201012732_9184be01-a45e-4689-affc-0503905c2647.sql
-- ==================================================================

-- Drop and recreate the public shared links policy to ensure it works for anonymous users
DROP POLICY IF EXISTS "Public can view shared links" ON public.shared_links;

-- Create policy that explicitly allows anonymous users to query shared_links
CREATE POLICY "Anyone can view shared links by short_code"
ON public.shared_links
FOR SELECT
TO anon, authenticated
USING (true);

-- ==================================================================
-- ORIGINAL MIGRATION: 20251207104644_79ebc14f-912a-4d9b-95b8-853cf6ce32d2.sql
-- ==================================================================

-- Create a SECURITY DEFINER function to safely resolve short links
-- This prevents enumeration of access_tokens via the public RLS policy
CREATE OR REPLACE FUNCTION public.resolve_short_link(_short_code text)
RETURNS TABLE(resource_type text, resource_id uuid, access_token text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT sl.resource_type, sl.resource_id, sl.access_token
  FROM public.shared_links sl
  WHERE sl.short_code = _short_code
  LIMIT 1;
$$;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Anyone can view shared links by short_code" ON public.shared_links;

-- ==================================================================
-- ORIGINAL MIGRATION: 20251208010516_e94126c0-7394-4090-b861-bab6e151c8a2.sql
-- ==================================================================

-- Create a SECURITY DEFINER function to validate share tokens
-- This allows unauthenticated users to validate tokens without direct table access
CREATE OR REPLACE FUNCTION public.validate_share_token(_token text)
RETURNS TABLE(resource_type text, resource_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT sl.resource_type, sl.resource_id
  FROM public.shared_links sl
  WHERE sl.access_token = _token
  LIMIT 1;
$$;

-- ==================================================================
-- ORIGINAL MIGRATION: 20251211072300_fix_shared_link_access.sql
-- ==================================================================

-- Fix shared link access control to match requirements:
-- 1. Game links: show game history only (no player details)
-- 2. Player links: show game history + specific player history only
-- 3. Authenticated users: can see all their own data through shared links

-- Ensure authenticated users can always access their own data
-- Update games policy to include authenticated user access
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;
CREATE POLICY "Public can view games with valid share token"
  ON public.games
  FOR SELECT
  USING (
    -- Authenticated users can always see their own games
    auth.uid() = user_id
    OR
    -- Or via valid share link
    has_any_valid_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      user_id
    )
  );

-- Update players policy to include authenticated user access
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;
CREATE POLICY "Public can view players with valid share token"
  ON public.players
  FOR SELECT
  USING (
    -- Authenticated users can always see their own players
    auth.uid() = user_id
    OR
    -- Or via player-specific share link
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
    OR
    -- Or player is visible in game context (for showing names in game views)
    can_view_player_in_game_context(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      id
    )
  );

-- Update game_players policy to include authenticated user access and player-specific links
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;
CREATE POLICY "Public can view game_players with valid share token"
  ON public.game_players
  FOR SELECT
  USING (
    -- Authenticated users can see game_players for their own games
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = game_players.game_id
        AND games.user_id = auth.uid()
    )
    OR
    -- Or via any valid link for game details
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = game_players.game_id
        AND has_any_valid_link(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          games.user_id
        )
    )
    OR
    -- Or via player-specific link for this player's game history
    can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      game_players.player_id
    )
  );

-- Update buy_in_history policy to include authenticated user access and player-specific links
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;
CREATE POLICY "Public can view buy-in history with valid share token"
  ON public.buy_in_history
  FOR SELECT
  USING (
    -- Authenticated users can see buy-in history for their own games
    EXISTS (
      SELECT 1
      FROM game_players gp
      JOIN games g ON g.id = gp.game_id
      WHERE gp.id = buy_in_history.game_player_id
        AND g.user_id = auth.uid()
    )
    OR
    -- Or via valid share link
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
    OR
    -- Or via player-specific link for this player's buy-in history
    EXISTS (
      SELECT 1
      FROM game_players gp
      WHERE gp.id = buy_in_history.game_player_id
        AND can_view_player(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          gp.player_id
        )
    )
  );

-- Update table_positions policy to include authenticated user access and player-specific links
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;
CREATE POLICY "Public can view table positions with valid share token"
  ON public.table_positions
  FOR SELECT
  USING (
    -- Authenticated users can see table positions for their own games
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = table_positions.game_id
        AND games.user_id = auth.uid()
    )
    OR
    -- Or via valid share link
    EXISTS (
      SELECT 1
      FROM games
      WHERE games.id = table_positions.game_id
        AND has_any_valid_link(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          games.user_id
        )
    )
    OR
    -- Or via player-specific link (for viewing table positions in player's game history)
    EXISTS (
      SELECT 1
      FROM game_players gp
      WHERE gp.game_id = table_positions.game_id
        AND can_view_player(
          ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
          gp.player_id
        )
    )
  );


-- ==================================================================
-- ORIGINAL MIGRATION: 20251211123000_delete_all_shared_links.sql
-- ==================================================================

-- Delete all existing shared links to start fresh
DELETE FROM public.shared_links;


-- ==================================================================
-- ORIGINAL MIGRATION: 20251211180100_create_user_preferences_table.sql
-- ==================================================================

-- Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  card_back_design TEXT DEFAULT 'classic',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT user_preferences_user_id_key UNIQUE (user_id)
);

-- Add check constraint for card_back_design
ALTER TABLE public.user_preferences
ADD CONSTRAINT card_back_design_check 
CHECK (card_back_design IN ('classic', 'geometric', 'diamond', 'hexagon', 'wave', 'radial'));

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own preferences
CREATE POLICY "Users can read their own preferences"
  ON public.user_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy for users to insert their own preferences
CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own preferences
CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create policy for users to delete their own preferences
CREATE POLICY "Users can delete their own preferences"
  ON public.user_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to call the function
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_preferences_updated_at();


-- ==================================================================
-- ORIGINAL MIGRATION: 20251212050000_remove_unique_hand_number_constraint.sql
-- ==================================================================

-- Remove the unique constraint on (game_id, hand_number) to allow global hand numbering
-- Hand numbers will now be cumulative across all games from inception
ALTER TABLE public.poker_hands 
DROP CONSTRAINT IF EXISTS poker_hands_game_id_hand_number_key;


-- ==================================================================
-- ORIGINAL MIGRATION: 20251212083700_add_whatsapp_fields.sql
-- ==================================================================

-- Add phone number, UPI ID and payment preference fields to players table
ALTER TABLE public.players 
ADD COLUMN phone_number TEXT,
ADD COLUMN upi_id TEXT,
ADD COLUMN payment_preference TEXT DEFAULT 'upi' CHECK (payment_preference IN ('upi', 'cash'));

-- Add settlements column to games table if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'games' 
    AND column_name = 'settlements'
  ) THEN
    ALTER TABLE public.games ADD COLUMN settlements JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_phone_number ON public.players(phone_number);

-- Comment on columns for documentation
COMMENT ON COLUMN public.players.phone_number IS 'WhatsApp phone number for notifications (E.164 format recommended)';
COMMENT ON COLUMN public.players.upi_id IS 'UPI ID for receiving payments (e.g., username@paytm, 9876543210@ybl)';
COMMENT ON COLUMN public.players.payment_preference IS 'Player''s preferred payment method: upi or cash (auto-set to cash if no UPI ID)';


-- ==================================================================
-- ORIGINAL MIGRATION: 20251212190000_replace_phone_with_email.sql
-- ==================================================================

-- Replace phone_number with email field in players table
-- Drop the index on phone_number first
DROP INDEX IF EXISTS public.idx_players_phone_number;

-- Rename phone_number column to email
ALTER TABLE public.players RENAME COLUMN phone_number TO email;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_email ON public.players(email);

-- Update column comment for documentation
COMMENT ON COLUMN public.players.email IS 'Email address for notifications and reports';

-- Update payment_preference to allow manual setting (remove dependency on UPI ID)
-- The default is now 'upi' but can be changed independently
COMMENT ON COLUMN public.players.payment_preference IS 'Player''s preferred payment method: upi or cash (can be set manually)';


-- ==================================================================
-- ORIGINAL MIGRATION: 20251224211000_repair_rls_policies.sql
-- ==================================================================

-- Fix RLS policies to ensure authenticated users can access their data
-- This migration drops conflicting/incomplete policies and recreates them
-- to explicitly allow authenticated access OR valid shared link access.

-- Games
DROP POLICY IF EXISTS "Users can view their own games" ON public.games;
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;

CREATE POLICY "Authenticated users and shared links can view games"
ON public.games
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR
  has_any_valid_link(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    user_id
  )
);

-- Players
DROP POLICY IF EXISTS "Users can view their own players" ON public.players;
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;

CREATE POLICY "Authenticated users and shared links can view players"
ON public.players
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR
  can_view_player(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
  OR
  can_view_player_in_game_context(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
);

-- Game Players
DROP POLICY IF EXISTS "Users can view game_players for their games" ON public.game_players;
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;

CREATE POLICY "Authenticated users and shared links can view game_players"
ON public.game_players
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_players.game_id
    AND (
      games.user_id = auth.uid()
      OR
      has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        games.user_id
      )
    )
  )
  OR
  -- Allow viewing if specific player link exists (for that player's history)
  can_view_player(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    game_players.player_id
  )
);

-- Buy In History
DROP POLICY IF EXISTS "Users can view buy_in_history for their games" ON public.buy_in_history;
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;

CREATE POLICY "Authenticated users and shared links can view buy_in_history"
ON public.buy_in_history
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND (
      g.user_id = auth.uid()
      OR
      has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        g.user_id
      )
    )
  )
  OR
  -- Allow viewing if specific player link exists (for that player's history)
  EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.id = buy_in_history.game_player_id
    AND can_view_player(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      gp.player_id
    )
  )
);

-- Table Positions
DROP POLICY IF EXISTS "Users can view table_positions for their games" ON public.table_positions;
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;

CREATE POLICY "Authenticated users and shared links can view table_positions"
ON public.table_positions
FOR SELECT
TO anon, authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND (
      games.user_id = auth.uid()
      OR
      has_any_valid_link(
        ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
        games.user_id
      )
    )
  )
);


-- ==================================================================
-- ORIGINAL MIGRATION: 20251225_fix_rls_functions_and_policies.sql
-- ==================================================================

-- Migration to fix RLS functions and policies
-- This migration resolves the issue where authenticated users cannot see their data
-- because of missing helper functions in the previous policy definitions.

-- 1. Create Helper Functions for Token Validation

-- Function to check if a token matches a specific game
CREATE OR REPLACE FUNCTION public.is_valid_game_link(_token text, _game_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE resource_type = 'game'
      AND resource_id = _game_id
      AND access_token = _token
  );
$$;

-- Function to check if a token matches a specific player
CREATE OR REPLACE FUNCTION public.is_valid_player_link(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.shared_links
    WHERE resource_type = 'player'
      AND resource_id = _player_id
      AND access_token = _token
  );
$$;

-- Function to check if a token allows viewing a player in the context of a game
-- (e.g., if you have a game link, you should see the names of players in that game)
CREATE OR REPLACE FUNCTION public.can_view_player_in_game_context(_token text, _player_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.player_id = _player_id
      AND public.is_valid_game_link(_token, g.id)
  );
$$;


-- 2. Update RLS Policies using the new functions

-- GAMES
DROP POLICY IF EXISTS "Authenticated users and shared links can view games" ON public.games;
DROP POLICY IF EXISTS "Users can view their own games" ON public.games;
DROP POLICY IF EXISTS "Public can view games with valid share token" ON public.games;

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
);

-- PLAYERS
DROP POLICY IF EXISTS "Authenticated users and shared links can view players" ON public.players;
DROP POLICY IF EXISTS "Users can view their own players" ON public.players;
DROP POLICY IF EXISTS "Public can view players with valid share token" ON public.players;

CREATE POLICY "Authenticated users and shared links can view players"
ON public.players
FOR SELECT
TO anon, authenticated
USING (
  auth.uid() = user_id
  OR
  public.is_valid_player_link(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
  OR
  public.can_view_player_in_game_context(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    id
  )
);

-- GAME_PLAYERS
DROP POLICY IF EXISTS "Authenticated users and shared links can view game_players" ON public.game_players;
DROP POLICY IF EXISTS "Users can view game_players for their games" ON public.game_players;
DROP POLICY IF EXISTS "Public can view game_players with valid share token" ON public.game_players;

CREATE POLICY "Authenticated users and shared links can view game_players"
ON public.game_players
FOR SELECT
TO anon, authenticated
USING (
  -- Owner access
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_players.game_id
    AND games.user_id = auth.uid()
  )
  OR
  -- Shared Game Link access
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = game_players.game_id
    AND public.is_valid_game_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      games.id
    )
  )
  OR
  -- Shared Player Link access (view your history)
  public.is_valid_player_link(
    ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
    game_players.player_id
  )
);

-- BUY_IN_HISTORY
DROP POLICY IF EXISTS "Authenticated users and shared links can view buy_in_history" ON public.buy_in_history;
DROP POLICY IF EXISTS "Users can view buy_in_history for their games" ON public.buy_in_history;
DROP POLICY IF EXISTS "Public can view buy-in history with valid share token" ON public.buy_in_history;

CREATE POLICY "Authenticated users and shared links can view buy_in_history"
ON public.buy_in_history
FOR SELECT
TO anon, authenticated
USING (
  -- Owner access
  EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND g.user_id = auth.uid()
  )
  OR
  -- Shared Game Link access
  EXISTS (
    SELECT 1 FROM public.game_players gp
    JOIN public.games g ON g.id = gp.game_id
    WHERE gp.id = buy_in_history.game_player_id
    AND public.is_valid_game_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      g.id
    )
  )
  OR
  -- Shared Player Link access
  EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.id = buy_in_history.game_player_id
    AND public.is_valid_player_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      gp.player_id
    )
  )
);

-- TABLE_POSITIONS
DROP POLICY IF EXISTS "Authenticated users and shared links can view table_positions" ON public.table_positions;
DROP POLICY IF EXISTS "Users can view table_positions for their games" ON public.table_positions;
DROP POLICY IF EXISTS "Public can view table positions with valid share token" ON public.table_positions;

CREATE POLICY "Authenticated users and shared links can view table_positions"
ON public.table_positions
FOR SELECT
TO anon, authenticated
USING (
  -- Owner access
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND games.user_id = auth.uid()
  )
  OR
  -- Shared Game Link access
  EXISTS (
    SELECT 1 FROM public.games
    WHERE games.id = table_positions.game_id
    AND public.is_valid_game_link(
      ((current_setting('request.headers'::text, true))::json ->> 'x-share-token'::text),
      games.id
    )
  )
);


-- ==================================================================
-- ORIGINAL MIGRATION: 20260101120000_fix_player_link_game_access.sql
-- ==================================================================

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


-- ==================================================================
-- ORIGINAL MIGRATION: 20260101140000_add_gemini_api_key.sql
-- ==================================================================

-- Add gemini_api_key to profiles table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gemini_api_key') THEN 
        ALTER TABLE profiles ADD COLUMN gemini_api_key text;
        -- Optional: Add comment or security note
        COMMENT ON COLUMN profiles.gemini_api_key IS 'User provided Gemini API Key';
    END IF;
END $$;


-- ==================================================================
-- ORIGINAL MIGRATION: 20260204120000_owner_centric_access.sql
-- ==================================================================

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

