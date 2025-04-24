-- Add Chess.com fields to users table
ALTER TABLE users ADD COLUMN chess_username VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN chess_rating INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN chess_rapid_rating INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN chess_bullet_rating INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN chess_daily_rating INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN chess_tactics_rating INT DEFAULT NULL;
ALTER TABLE users ADD COLUMN chess_puzzle_rush_rating INT DEFAULT NULL;

-- Update any SQL for PostgreSQL if needed
-- For PostgreSQL, use this syntax:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_username VARCHAR(50);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_rating INT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_rapid_rating INT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_bullet_rating INT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_daily_rating INT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_tactics_rating INT;
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_puzzle_rush_rating INT; 