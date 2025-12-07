-- SIMPLE TEST: Find the exact problem
-- Run these queries IN ORDER in Supabase SQL Editor

-- ========================================
-- TEST 1: Can you see the table at all?
-- ========================================
SELECT COUNT(*) as total_sessions 
FROM practice_sessions;
-- Should return a number

-- ========================================
-- TEST 2: Can you see YOUR sessions?
-- ========================================
SELECT 
  id,
  session_code,
  host_user_id,
  is_active,
  auth.uid() as your_id
FROM practice_sessions
WHERE host_user_id = auth.uid()
LIMIT 5;
-- Should show your sessions

-- ========================================
-- TEST 3: What policies exist?
-- ========================================
SELECT policyname, cmd 
FROM pg_policies 
WHERE tablename = 'practice_sessions';
-- Should show: SELECT, INSERT, UPDATE, DELETE policies

-- ========================================
-- TEST 4: What does the UPDATE policy look like?
-- ========================================
SELECT 
  policyname,
  qual::text as using_expression,
  with_check::text as with_check_expression
FROM pg_policies 
WHERE tablename = 'practice_sessions' 
AND cmd = 'UPDATE';
-- CRITICAL: Both expressions should be: (auth.uid() = host_user_id)

-- ========================================
-- TEST 5: Manual update test
-- ========================================
-- Get a session ID first:
SELECT id, session_code, is_active 
FROM practice_sessions 
WHERE host_user_id = auth.uid() 
AND is_active = true 
LIMIT 1;

-- Copy the ID and paste it below (replace YOUR_SESSION_ID):
-- UPDATE practice_sessions 
-- SET is_active = false 
-- WHERE id = 'YOUR_SESSION_ID';

-- If THIS fails, the problem is in the database
-- If THIS works, the problem is in the client code

-- ========================================
-- TEST 6: Check the actual policy definition
-- ========================================
\d+ practice_sessions
-- Look for "Policies:" section at the bottom
