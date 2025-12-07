-- Comprehensive debug script for session ending issues
-- Run these queries in Supabase SQL Editor to diagnose problems

-- ==================================================
-- STEP 1: Check your current user ID
-- ==================================================
SELECT auth.uid() as my_user_id;

-- ==================================================
-- STEP 2: List all your sessions with full details
-- ==================================================
SELECT 
  id,
  session_code,
  session_name,
  host_user_id,
  is_active,
  created_at,
  (host_user_id = auth.uid()) as you_are_host
FROM practice_sessions
WHERE host_user_id = auth.uid()
ORDER BY created_at DESC;

-- ==================================================
-- STEP 3: Check RLS policies on practice_sessions
-- ==================================================
SELECT 
  policyname,
  cmd,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'practice_sessions'
ORDER BY cmd;

-- ==================================================
-- STEP 4: Test if you can UPDATE a specific session
-- Replace 'SESSION_ID_HERE' with actual session ID from Step 2
-- ==================================================
-- First, check the session exists and you're the host
SELECT 
  id,
  session_code,
  host_user_id,
  is_active,
  auth.uid() as your_user_id,
  (host_user_id = auth.uid()) as you_can_update
FROM practice_sessions
WHERE id = 'SESSION_ID_HERE';

-- Now try to update it
-- UPDATE practice_sessions
-- SET is_active = false
-- WHERE id = 'SESSION_ID_HERE'
-- RETURNING *;

-- ==================================================
-- STEP 5: Check if RLS is enabled
-- ==================================================
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'practice_sessions';

-- ==================================================
-- STEP 6: Test UPDATE permission directly
-- This shows if the policy allows you to update
-- ==================================================
SELECT 
  has_table_privilege(auth.uid()::text, 'practice_sessions', 'UPDATE') as can_update_table;

-- ==================================================
-- STEP 7: Check for any database triggers
-- ==================================================
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'practice_sessions';

-- ==================================================
-- STEP 8: Manually end a session (for testing)
-- Replace SESSION_CODE with your actual session code
-- ==================================================
-- UPDATE practice_sessions
-- SET is_active = false
-- WHERE session_code = 'YOUR_CODE'
-- AND host_user_id = auth.uid()
-- RETURNING id, session_code, is_active;

-- ==================================================
-- STEP 9: Check if there are any active sessions
-- ==================================================
SELECT 
  session_code,
  session_name,
  is_active,
  host_user_id = auth.uid() as you_are_host
FROM practice_sessions
WHERE is_active = true
AND host_user_id = auth.uid();

-- ==================================================
-- STEP 10: Force end all your active sessions
-- Use this as last resort for testing
-- ==================================================
-- UPDATE practice_sessions
-- SET is_active = false
-- WHERE host_user_id = auth.uid()
-- AND is_active = true
-- RETURNING session_code, session_name;

-- ==================================================
-- EXPECTED RESULTS GUIDE
-- ==================================================
-- 
-- If STEP 1 returns NULL:
--   → You're not logged in to Supabase SQL Editor
--   → Solution: Make sure you're using authenticated connection
--
-- If STEP 2 returns no rows:
--   → You haven't created any sessions
--   → Solution: Create a session first from the UI
--
-- If STEP 3 shows no "UPDATE" policy:
--   → RLS policies are missing
--   → Solution: Run migration 010_create_practice_sessions.sql
--
-- If STEP 4 shows you_can_update = false:
--   → You're not the host of that session
--   → Solution: Use a session you created
--
-- If STEP 5 shows rls_enabled = false:
--   → RLS is disabled (shouldn't happen)
--   → Solution: Enable RLS on the table
--
-- If STEP 6 returns false:
--   → Your user doesn't have UPDATE permission
--   → Solution: Check database role permissions
--
-- If UPDATE query in STEP 8 fails:
--   → RLS policy is blocking you
--   → Check error message for details
--   → Verify you're the host (host_user_id = auth.uid())
