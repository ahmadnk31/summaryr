-- Debug script to check why session ending might not work
-- Run this in Supabase SQL Editor

-- 1. Check all active sessions and their hosts
SELECT 
  id,
  session_code,
  session_name,
  host_user_id,
  is_active,
  created_at,
  expires_at
FROM practice_sessions
WHERE is_active = true
ORDER BY created_at DESC;

-- 2. Check RLS policies on practice_sessions table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'practice_sessions'
ORDER BY cmd, policyname;

-- 3. Check if current user can update sessions (run as logged-in user)
SELECT 
  ps.id,
  ps.session_code,
  ps.host_user_id,
  auth.uid() as current_user_id,
  (auth.uid() = ps.host_user_id) as can_update,
  ps.is_active
FROM practice_sessions ps
WHERE ps.is_active = true
ORDER BY ps.created_at DESC;

-- 4. Manually test UPDATE (replace SESSION_ID_HERE with actual session ID)
-- This will show if RLS is blocking or if there's another issue
-- UPDATE practice_sessions 
-- SET is_active = false 
-- WHERE id = 'SESSION_ID_HERE' 
-- AND host_user_id = auth.uid();

-- 5. Check if there are any triggers that might interfere
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'practice_sessions';

-- 6. Force update a session (as superuser/service role - for testing only)
-- This bypasses RLS to confirm the table structure is correct
-- DO $$
-- DECLARE
--   test_session_id uuid;
-- BEGIN
--   SELECT id INTO test_session_id FROM practice_sessions WHERE is_active = true LIMIT 1;
--   IF test_session_id IS NOT NULL THEN
--     UPDATE practice_sessions SET is_active = false WHERE id = test_session_id;
--     RAISE NOTICE 'Updated session % to inactive', test_session_id;
--   ELSE
--     RAISE NOTICE 'No active sessions found';
--   END IF;
-- END $$;
