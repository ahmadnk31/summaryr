-- DEEP DIVE: Why is the UPDATE still failing?
-- Run these queries one by one to find the exact issue

-- ========================================
-- Query 1: Verify RLS is enabled
-- ========================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'practice_sessions';
-- Expected: rls_enabled = true

-- ========================================
-- Query 2: Check ALL policies on the table
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text as using_clause,
  with_check::text as with_check_clause
FROM pg_policies
WHERE tablename = 'practice_sessions'
ORDER BY cmd, policyname;
-- Look for the UPDATE policy - both qual and with_check should have the same value

-- ========================================
-- Query 3: Check your user ID
-- ========================================
SELECT auth.uid() as your_user_id;
-- This should return a UUID, not NULL

-- ========================================
-- Query 4: Check if you actually own any active sessions
-- ========================================
SELECT 
  id,
  session_code,
  session_name,
  host_user_id,
  is_active,
  (host_user_id = auth.uid()) as you_are_owner
FROM practice_sessions
WHERE is_active = true
ORDER BY created_at DESC;
-- you_are_owner should be TRUE

-- ========================================
-- Query 5: Try UPDATE with explicit logging
-- ========================================
DO $$
DECLARE
  v_user_id uuid;
  v_session_id uuid;
  v_host_id uuid;
BEGIN
  -- Get current user
  SELECT auth.uid() INTO v_user_id;
  RAISE NOTICE 'Current user ID: %', v_user_id;
  
  -- Get first active session
  SELECT id, host_user_id INTO v_session_id, v_host_id
  FROM practice_sessions
  WHERE is_active = true
  AND host_user_id = v_user_id
  LIMIT 1;
  
  RAISE NOTICE 'Session ID: %, Host ID: %', v_session_id, v_host_id;
  
  IF v_session_id IS NULL THEN
    RAISE NOTICE 'No active sessions found for this user';
    RETURN;
  END IF;
  
  -- Try the update
  UPDATE practice_sessions
  SET is_active = false
  WHERE id = v_session_id
  AND host_user_id = v_user_id;
  
  RAISE NOTICE 'Update successful!';
  
  -- Rollback to keep session active for testing
  RAISE EXCEPTION 'Rolling back (this is intentional for testing)';
END $$;

-- ========================================
-- Query 6: Check if policies are applied to your role
-- ========================================
SELECT 
  r.rolname,
  r.rolsuper,
  r.rolinherit,
  r.rolcreaterole,
  r.rolcreatedb,
  r.rolcanlogin,
  r.rolbypassrls
FROM pg_roles r
WHERE r.rolname = current_user;
-- rolbypassrls should be FALSE (we want RLS to apply)

-- ========================================
-- Query 7: Disable RLS temporarily (TESTING ONLY)
-- ========================================
-- WARNING: This removes security! Only for testing!
-- ALTER TABLE practice_sessions DISABLE ROW LEVEL SECURITY;

-- Try update again, then re-enable:
-- ALTER TABLE practice_sessions ENABLE ROW LEVEL SECURITY;

-- ========================================
-- Query 8: Check if there are conflicting policies
-- ========================================
SELECT 
  policyname,
  cmd,
  permissive
FROM pg_policies
WHERE tablename = 'practice_sessions'
AND cmd = 'UPDATE';
-- Should only see ONE UPDATE policy

-- ========================================
-- Query 9: Try creating a more permissive test policy
-- ========================================
-- First, let's try a super permissive policy to see if it works

-- Drop existing
DROP POLICY IF EXISTS "Hosts can update their sessions" ON public.practice_sessions;

-- Create ultra-permissive policy (TEMPORARY - for testing only)
CREATE POLICY "Test update policy" ON public.practice_sessions
  FOR UPDATE 
  USING (true)  -- Allow selecting any row
  WITH CHECK (true);  -- Allow any update

-- Now try to update from the UI
-- If THIS works, then the issue is with auth.uid() = host_user_id comparison

-- ========================================
-- Query 10: Check auth.uid() function
-- ========================================
SELECT 
  auth.uid() as from_function,
  current_user as current_db_user,
  session_user as session_db_user;
-- Verify auth.uid() is actually returning your user ID

-- ========================================
-- Query 11: Restore proper policy after testing
-- ========================================
-- After testing with the permissive policy above, restore the correct one:

-- DROP POLICY IF EXISTS "Test update policy" ON public.practice_sessions;

-- CREATE POLICY "Hosts can update their sessions" ON public.practice_sessions
--   FOR UPDATE 
--   USING (auth.uid() = host_user_id)
--   WITH CHECK (auth.uid() = host_user_id);
