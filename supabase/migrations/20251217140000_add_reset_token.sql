-- Add reset_token fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS reset_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS reset_token_expires_at TIMESTAMP
WITH
    TIME ZONE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_reset_token ON profiles (reset_token);