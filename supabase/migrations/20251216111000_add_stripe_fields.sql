-- Add subscription fields to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS plan_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'active';

-- Create an index for faster lookups by customer ID (used in webhooks)
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON profiles (stripe_customer_id);

-- Start with a plan type enum if you want to be stricter (optional, but good practice)
-- CREATE TYPE plan_tier_enum AS ENUM ('free', 'pro', 'team');
-- ALTER TABLE profiles ALTER COLUMN plan_tier TYPE plan_tier_enum USING plan_tier::plan_tier_enum;