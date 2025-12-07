-- CRITICAL FIX: Run this immediately in Supabase SQL Editor
-- This fixes the "new row violates row-level security policy" error

-- ========================================
-- STEP 1: Check current policy (before fix)
-- ========================================
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'practice_sessions' AND cmd = 'UPDATE';

-- Expected: with_check_clause will be NULL or same as using_clause
-- This is the problem!

-- ========================================
-- STEP 2: Apply the fix
-- ========================================

-- Drop the broken policy
DROP POLICY IF EXISTS "Hosts can update their sessions" ON public.practice_sessions;

-- Create the correct policy with BOTH clauses
CREATE POLICY "Hosts can update their sessions" ON public.practice_sessions
  FOR UPDATE 
  USING (auth.uid() = host_user_id)
  WITH CHECK (auth.uid() = host_user_id);

-- ========================================
-- STEP 3: Verify the fix worked
-- ========================================
SELECT 
  policyname,
  cmd,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies
WHERE tablename = 'practice_sessions' AND cmd = 'UPDATE';

-- Expected result:
-- policyname: "Hosts can update their sessions"
-- cmd: "UPDATE"
-- using_clause: (auth.uid() = host_user_id)
-- with_check_clause: (auth.uid() = host_user_id)  <- THIS MUST NOT BE NULL!

-- ========================================
-- STEP 4: Test the update manually
-- ========================================

-- First, get an active session ID
SELECT id, session_code, host_user_id, is_active
FROM practice_sessions
WHERE host_user_id = auth.uid()
AND is_active = true
LIMIT 1;

-- Copy the session ID from above and test update:
-- (Replace 'YOUR_SESSION_ID' with actual ID)

-- UPDATE practice_sessions
-- SET is_active = false
-- WHERE id = 'YOUR_SESSION_ID'
-- AND host_user_id = auth.uid()
-- RETURNING id, session_code, is_active;

-- If this works, the UI will work too!

-- ========================================
-- TROUBLESHOOTING
-- ========================================

-- If STEP 2 gives "permission denied":
-- You need to be a superuser or service role
-- Go to Supabase Dashboard → SQL Editor → Run as service role

-- If STEP 4 still fails:
-- 1. Check you're logged into Supabase SQL Editor
-- 2. Run: SELECT auth.uid();  (should not be NULL)
-- 3. Verify host_user_id matches your user ID

-- To see all policies on the table:
-- SELECT * FROM pg_policies WHERE tablename = 'practice_sessions';
