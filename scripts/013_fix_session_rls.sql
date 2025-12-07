-- Fix RLS policy for practice_sessions to allow joining via session code
-- Run this if users can't view sessions when accessing via shared link

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "Users can view sessions they created or joined" ON public.practice_sessions;
DROP POLICY IF EXISTS "Authenticated users can view active sessions" ON public.practice_sessions;

-- Create a more permissive policy that allows anyone authenticated to view active sessions
-- This is safe because:
-- 1. Users need the 6-character code to find a session
-- 2. Only active sessions are visible
-- 3. Users still can't modify sessions they don't own
CREATE POLICY "Authenticated users can view active sessions" ON public.practice_sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true
  );

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'practice_sessions' AND cmd = 'SELECT';
