-- Add quran_daily_goal column to user_settings table (if not already present)
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS quran_daily_goal INTEGER DEFAULT 2; 