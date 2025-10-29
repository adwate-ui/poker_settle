-- Add is_split column to poker_hands table
ALTER TABLE public.poker_hands 
ADD COLUMN is_split boolean DEFAULT false;

-- Add comment to explain the column
COMMENT ON COLUMN public.poker_hands.is_split IS 'True when the pot is split between multiple players with identical hands';