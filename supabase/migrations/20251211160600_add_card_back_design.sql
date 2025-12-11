-- Add card_back_design column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS card_back_design TEXT DEFAULT 'classic';

-- Add check constraint for card_back_design
-- NOTE: If new card back designs are added to the application,
-- this constraint must be updated via a new migration to include the new values.
-- Allowed values are defined in src/hooks/useCardBackDesign.ts
ALTER TABLE user_preferences
ADD CONSTRAINT card_back_design_check 
CHECK (card_back_design IN ('classic', 'geometric', 'diamond', 'hexagon', 'wave', 'radial'));
