-- Add profile fields to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;

-- Update existing admin with profile info
-- Existing profiles are managed through the panel, not overwritten by migrations.

-- No default administrator accounts are created.
-- User creation is handled by protected setup and the Team panel; no default credentials.
