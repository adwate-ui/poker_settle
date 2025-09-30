-- Drop the existing unique constraint on name if it exists
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_name_key;

-- Add a composite unique constraint for user_id and name
-- This allows the same player name to exist for different users
ALTER TABLE public.players ADD CONSTRAINT players_user_id_name_key UNIQUE (user_id, name);