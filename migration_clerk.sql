-- Migration: Rename users to profiles and adjust for Clerk

BEGIN;

-- Remove foreign key constraints temporarily if necessary, but PostgreSQL handles RENAME well.
-- Rename the table
ALTER TABLE users RENAME TO profiles;

-- Adjust columns
ALTER TABLE profiles ALTER COLUMN username DROP NOT NULL;
ALTER TABLE profiles ALTER COLUMN password DROP NOT NULL; -- Clerk handles passwords
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- update references (these should update automatically as they point to the OID, but good to check)
-- Actually, ALTER TABLE ... RENAME usually updates FKs pointing to it.

COMMIT;
