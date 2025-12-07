-- Migration: Fix RLS policy for practice_sessions UPDATE
-- The UPDATE policy needs WITH CHECK clause to allow changing is_active

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Hosts can update their sessions" ON public.practice_sessions;

-- Recreate with both USING and WITH CHECK
-- USING: Allows you to select rows where you're the host
-- WITH CHECK: Allows the updated row to still have you as host
CREATE POLICY "Hosts can update their sessions" ON public.practice_sessions
  FOR UPDATE 
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- Verify the policy was created correctly
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'practice_sessions' AND cmd = 'UPDATE';
