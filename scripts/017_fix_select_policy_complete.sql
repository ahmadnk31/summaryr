-- COMPLETE FIX: Update policies to allow hosts to see and update ALL their sessions
-- The problem: SELECT policy only shows active sessions, but UPDATE changes is_active to false

-- ========================================
-- Step 1: Drop existing SELECT policy
-- ========================================
DROP POLICY IF EXISTS "Authenticated users can view active sessions" ON public.practice_sessions;

-- ========================================
-- Step 2: Create NEW SELECT policy
-- ========================================
-- Hosts can see ALL their sessions (active or not)
-- Others can only see active sessions
CREATE POLICY "Users can view sessions" ON public.practice_sessions
  FOR SELECT USING (
    auth.uid() = host_user_id  -- Hosts see all their sessions
    OR 
    (auth.uid() IS NOT NULL AND is_active = true)  -- Others see active sessions
  );

-- ========================================
-- Step 3: Fix UPDATE policy (if not already done)
-- ========================================
DROP POLICY IF EXISTS "Hosts can update their sessions" ON public.practice_sessions;
DROP POLICY IF EXISTS "Test update policy" ON public.practice_sessions;

CREATE POLICY "Hosts can update their sessions" ON public.practice_sessions
  FOR UPDATE 
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- ========================================
-- Step 4: Verify policies
-- ========================================
SELECT 
  policyname,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'practice_sessions'
ORDER BY cmd, policyname;

-- Expected results:
-- SELECT policy: Should allow (host_user_id = auth.uid()) OR (is_active AND authenticated)
-- UPDATE policy: Both USING and WITH CHECK should be (host_user_id = auth.uid())

-- ========================================
-- Step 5: Test the fix
-- ========================================

-- You should now be able to:
-- 1. See all your sessions (active and inactive)
SELECT * FROM practice_sessions WHERE host_user_id = auth.uid();

-- 2. Update any of your sessions
-- UPDATE practice_sessions 
-- SET is_active = false 
-- WHERE host_user_id = auth.uid() 
-- AND is_active = true
-- LIMIT 1;

-- Migration complete! Refresh your browser and try ending a session.
