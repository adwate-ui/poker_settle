-- Remove the dangerous policy that allows public access to all game data
DROP POLICY IF EXISTS "Allow all operations on games" ON public.games;

-- The existing user-specific policies already provide proper access control:
-- - Users can view their own games
-- - Users can create their own games
-- - Users can update their own games
-- - Users can delete their own games