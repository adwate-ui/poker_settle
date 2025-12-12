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
