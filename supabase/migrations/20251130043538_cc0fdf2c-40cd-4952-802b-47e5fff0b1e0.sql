-- Add theme column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN theme text NOT NULL DEFAULT 'default' 
CHECK (theme IN ('default', 'one_piece', 'bleach', 'naruto', 'dandadan'));