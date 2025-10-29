-- Add positions column to poker_hands table to store table positions independently
ALTER TABLE public.poker_hands 
ADD COLUMN positions JSONB DEFAULT '[]'::jsonb;