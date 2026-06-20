ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_buy_in      NUMERIC,
  ADD COLUMN IF NOT EXISTS default_small_blind NUMERIC,
  ADD COLUMN IF NOT EXISTS default_big_blind   NUMERIC,
  ADD COLUMN IF NOT EXISTS default_rake        NUMERIC;
