-- Remove the unique constraint on (game_id, hand_number) to allow global hand numbering
-- Hand numbers will now be cumulative across all games from inception
ALTER TABLE public.poker_hands 
DROP CONSTRAINT IF EXISTS poker_hands_game_id_hand_number_key;
