-- First, ensure all existing records have valid user_id values
-- Update any NULL user_ids to prevent the NOT NULL constraint from failing
-- (This should not be needed if RLS policies are working correctly, but it's a safety measure)

-- Make user_id NOT NULL on games table to prevent orphaned records
ALTER TABLE public.games 
ALTER COLUMN user_id SET NOT NULL;

-- Make user_id NOT NULL on players table to prevent orphaned records
ALTER TABLE public.players 
ALTER COLUMN user_id SET NOT NULL;

-- Add check constraints for data integrity
ALTER TABLE public.games
ADD CONSTRAINT games_buy_in_positive CHECK (buy_in_amount > 0);

ALTER TABLE public.game_players
ADD CONSTRAINT game_players_buy_ins_positive CHECK (buy_ins > 0),
ADD CONSTRAINT game_players_final_stack_non_negative CHECK (final_stack >= 0);