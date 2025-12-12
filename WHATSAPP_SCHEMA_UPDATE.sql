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

-- Create settlement_confirmations table
CREATE TABLE IF NOT EXISTS public.settlement_confirmations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  settlement_from TEXT NOT NULL,
  settlement_to TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, player_name, settlement_from, settlement_to)
);

-- Enable RLS on settlement_confirmations
ALTER TABLE public.settlement_confirmations ENABLE ROW LEVEL SECURITY;

-- Create policy for settlement_confirmations
-- Allow users to view confirmations for their games
CREATE POLICY "Users can view settlement confirmations for their games" 
ON public.settlement_confirmations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE games.id = settlement_confirmations.game_id 
    AND games.user_id = auth.uid()
  )
);

-- Allow users to update confirmations for their games
CREATE POLICY "Users can update settlement confirmations for their games" 
ON public.settlement_confirmations FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE games.id = settlement_confirmations.game_id 
    AND games.user_id = auth.uid()
  )
);

-- Allow users to insert confirmations for their games
CREATE POLICY "Users can insert settlement confirmations for their games" 
ON public.settlement_confirmations FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE games.id = game_id 
    AND games.user_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates on settlement_confirmations
CREATE TRIGGER update_settlement_confirmations_updated_at
BEFORE UPDATE ON public.settlement_confirmations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on phone_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_phone_number ON public.players(phone_number);

-- Create index on upi_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_players_upi_id ON public.players(upi_id);

-- Create indexes on settlement_confirmations
CREATE INDEX IF NOT EXISTS idx_settlement_confirmations_game_id ON public.settlement_confirmations(game_id);
CREATE INDEX IF NOT EXISTS idx_settlement_confirmations_confirmed ON public.settlement_confirmations(confirmed);

-- Add comments on columns for documentation
COMMENT ON COLUMN public.players.phone_number IS 'WhatsApp phone number for notifications (E.164 format recommended, e.g., +919876543210)';
COMMENT ON COLUMN public.players.upi_id IS 'UPI ID for receiving payments (e.g., username@paytm, 9876543210@ybl)';
COMMENT ON COLUMN public.players.payment_preference IS 'Player''s preferred payment method: upi or cash (auto-set to cash if no UPI ID)';
COMMENT ON COLUMN public.games.settlements IS 'Calculated settlements for the game (JSON array of {from, to, amount})';
COMMENT ON TABLE public.settlement_confirmations IS 'Tracks payment confirmations for settlements';

-- ============================================================================
-- Verification Queries (optional - run these to verify the changes)
-- ============================================================================

-- Check if columns were added successfully to players table
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

-- Check settlement_confirmations table
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'settlement_confirmations'
ORDER BY ordinal_position;

-- Check indexes
SELECT 
  indexname, 
  tablename, 
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND (
    (tablename = 'players' AND indexname IN ('idx_players_phone_number', 'idx_players_upi_id'))
    OR (tablename = 'settlement_confirmations' AND indexname IN ('idx_settlement_confirmations_game_id', 'idx_settlement_confirmations_confirmed'))
  );

