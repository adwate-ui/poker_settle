-- Add settlements column to games table to store calculated settlements
ALTER TABLE public.games 
ADD COLUMN settlements JSONB DEFAULT '[]'::jsonb;