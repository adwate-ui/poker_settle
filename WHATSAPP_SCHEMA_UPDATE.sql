-- ============================================================================
-- WhatsApp Integration Schema Updates
-- Run this script in Supabase SQL Editor
-- ============================================================================

-- Add phone number, UPI ID and payment preference fields to players table
DO $$ 
BEGIN
  -- Add phone_number column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'players' 
    AND column_name = 'phone_number'
  ) THEN
    ALTER TABLE public.players ADD COLUMN phone_number TEXT;
  END IF;

  -- Add upi_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'players' 
    AND column_name = 'upi_id'
  ) THEN
    ALTER TABLE public.players ADD COLUMN upi_id TEXT;
  END IF;

  -- Add payment_preference column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'players' 
    AND column_name = 'payment_preference'
  ) THEN
    ALTER TABLE public.players ADD COLUMN payment_preference TEXT DEFAULT 'upi';
  END IF;
END $$;

-- Add check constraint for payment_preference if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'players_payment_preference_check'
  ) THEN
    ALTER TABLE public.players 
    ADD CONSTRAINT players_payment_preference_check 
    CHECK (payment_preference IN ('upi', 'cash'));
  END IF;
END $$;

-- Add settlements column to games table if it doesn't exist
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

-- Create index on upi_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_upi_id ON public.players(upi_id);

-- Add comments on columns for documentation
COMMENT ON COLUMN public.players.phone_number IS 'WhatsApp phone number for notifications (E.164 format recommended, e.g., +919876543210)';
COMMENT ON COLUMN public.players.upi_id IS 'UPI ID for receiving payments (e.g., username@paytm, 9876543210@ybl)';
COMMENT ON COLUMN public.players.payment_preference IS 'Player''s preferred payment method: upi or cash (auto-set to cash if no UPI ID)';
COMMENT ON COLUMN public.games.settlements IS 'Calculated settlements for the game (JSON array of {from, to, amount})';

-- ============================================================================
-- Verification Queries (optional - run these to verify the changes)
-- ============================================================================

-- Check if columns were added successfully
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'players' 
  AND column_name IN ('phone_number', 'upi_id', 'payment_preference')
ORDER BY ordinal_position;

-- Check games table settlements column
SELECT 
  column_name, 
  data_type, 
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'games' 
  AND column_name = 'settlements';

-- Check indexes
SELECT 
  indexname, 
  tablename, 
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename = 'players'
  AND indexname IN ('idx_players_phone_number', 'idx_players_upi_id');
