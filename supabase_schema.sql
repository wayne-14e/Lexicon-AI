-- Run this in your Supabase SQL Editor to create the necessary tables

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT UNIQUE NOT NULL,
  picture TEXT,
  tokens INTEGER DEFAULT 0,
  "lastDailyAwardDate" TEXT,
  streak INTEGER DEFAULT 1,
  words_generated INTEGER DEFAULT 0,
  narratives_used INTEGER DEFAULT 0,
  document_uploads_used INTEGER DEFAULT 0,
  lexy_prompts_used INTEGER DEFAULT 0,
  ai_refills_used INTEGER DEFAULT 0,
  tts_used INTEGER DEFAULT 0,
  limits_last_reset_date TEXT
);

-- Sync tokens with actual token count from token_transactions
UPDATE users
SET tokens = COALESCE((
  SELECT SUM(amount)
  FROM token_transactions
  WHERE token_transactions."userId" = users.id
), 0);

CREATE TABLE IF NOT EXISTS vocab_tables (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  links JSONB DEFAULT '[]'::jsonb,
  entries JSONB DEFAULT '[]'::jsonb,
  "createdAt" BIGINT NOT NULL,
  "contextPassage" JSONB
);

CREATE TABLE IF NOT EXISTS notes (
  "userId" TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS token_transactions (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT,
  "createdAt" BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS mastery_events (
  id TEXT PRIMARY KEY,
  "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
  word TEXT NOT NULL,
  "createdAt" BIGINT NOT NULL
);

-- Enable Row Level Security (RLS) and create policies if needed, 
-- or just disable RLS for simplicity during development:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE vocab_tables DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE token_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE mastery_events DISABLE ROW LEVEL SECURITY;
