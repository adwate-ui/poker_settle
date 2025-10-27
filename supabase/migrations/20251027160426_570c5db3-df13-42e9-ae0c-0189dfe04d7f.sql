-- Add support for multiple winners (chopped pots)
-- Add winner_player_ids array to replace single winner_player_id
ALTER TABLE poker_hands 
ADD COLUMN winner_player_ids uuid[] DEFAULT '{}';

-- Create index for winner lookups
CREATE INDEX idx_poker_hands_winner_ids ON poker_hands USING GIN(winner_player_ids);

-- Migrate existing single winner data to array format
UPDATE poker_hands 
SET winner_player_ids = ARRAY[winner_player_id]::uuid[]
WHERE winner_player_id IS NOT NULL;

-- Keep winner_player_id for backward compatibility but it's now optional