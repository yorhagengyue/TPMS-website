-- Add Chess.com fields to users table
ALTER TABLE users ADD COLUMN chess_username VARCHAR(50) DEFAULT NULL;
ALTER TABLE users ADD COLUMN chess_rating INT DEFAULT NULL;

-- Update any SQL for PostgreSQL if needed
-- For PostgreSQL, use this syntax:
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_username VARCHAR(50);
-- ALTER TABLE users ADD COLUMN IF NOT EXISTS chess_rating INT; 