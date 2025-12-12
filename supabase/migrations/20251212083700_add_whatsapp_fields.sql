-- Add phone number, UPI ID and payment preference fields to players table
ALTER TABLE public.players 
ADD COLUMN phone_number TEXT,
ADD COLUMN upi_id TEXT,
ADD COLUMN payment_preference TEXT DEFAULT 'upi' CHECK (payment_preference IN ('upi', 'cash'));

-- Add settlements column to games table if it doesn't exist (for backward compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'games' 
    AND column_name = 'settlements'
  ) THEN
    ALTER TABLE public.games ADD COLUMN settlements JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_phone_number ON public.players(phone_number);

-- Comment on columns for documentation
COMMENT ON COLUMN public.players.phone_number IS 'WhatsApp phone number for notifications (E.164 format recommended)';
COMMENT ON COLUMN public.players.upi_id IS 'UPI ID for receiving payments (e.g., username@paytm, 9876543210@ybl)';
COMMENT ON COLUMN public.players.payment_preference IS 'Player''s preferred payment method: upi or cash (auto-set to cash if no UPI ID)';
