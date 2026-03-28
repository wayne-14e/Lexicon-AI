-- Run this in your Supabase SQL Editor to add the missing columns for the daily streak system

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "lastDailyAwardDate" TEXT,
ADD COLUMN IF NOT EXISTS streak INTEGER DEFAULT 1;

-- Optional: Ensure existing users have a streak of 1
UPDATE users SET streak = 1 WHERE streak IS NULL;
