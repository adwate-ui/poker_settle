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