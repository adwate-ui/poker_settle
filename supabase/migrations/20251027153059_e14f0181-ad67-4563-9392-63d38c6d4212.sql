-- Add position column to player_actions table
ALTER TABLE player_actions ADD COLUMN IF NOT EXISTS position text;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_player_actions_position ON player_actions(position);