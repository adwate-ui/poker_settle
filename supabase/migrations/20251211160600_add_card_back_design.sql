-- Add card_back_design column to user_preferences table
ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS card_back_design TEXT DEFAULT 'classic';

-- Add check constraint for card_back_design
ALTER TABLE user_preferences
ADD CONSTRAINT card_back_design_check 
CHECK (card_back_design IN ('classic', 'geometric', 'diamond', 'hexagon', 'wave', 'radial'));
