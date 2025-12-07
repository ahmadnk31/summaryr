-- EMERGENCY DEBUG: Test if RLS is blocking access
-- Run these queries ONE BY ONE and tell me the results

-- Step 1: Get your current session info
SELECT 
  id as session_id,
  session_code,
  host_user_id,
  session_type,
  is_active
FROM practice_sessions 
WHERE is_active = true 
ORDER BY created_at DESC 
LIMIT 1;

-- Copy the session_id from above, then continue:

-- Step 2: Check participants (replace SESSION_ID with the id from step 1)
SELECT 
  psp.id as participant_id,
  psp.user_id,
  psp.display_name,
  u.email
FROM practice_session_participants psp
JOIN auth.users u ON psp.user_id = u.id
WHERE psp.session_id = 'SESSION_ID_HERE';  -- REPLACE THIS

-- Step 3: Get host's flashcards count
SELECT 
  user_id as host_id,
  u.email as host_email,
  COUNT(*) as flashcard_count
FROM flashcards f
JOIN auth.users u ON f.user_id = u.id
GROUP BY user_id, u.email;

-- Step 4: Check if the RLS policy exists
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'flashcards' 
  AND cmd = 'SELECT';

-- Step 5: BYPASS RLS to test (run as Supabase admin)
-- This will show if the data exists regardless of RLS
SET ROLE postgres;
SELECT 
  f.id,
  f.front_text,
  f.user_id,
  u.email as owner_email
FROM flashcards f
JOIN auth.users u ON f.user_id = u.id
LIMIT 3;
RESET ROLE;

-- Step 6: Test the policy logic manually
-- Replace USER_ID with participant's user_id from Step 2
SELECT ps.host_user_id 
FROM public.practice_sessions ps
JOIN public.practice_session_participants psp ON ps.id = psp.session_id
WHERE psp.user_id = 'PARTICIPANT_USER_ID_HERE'  -- REPLACE THIS
  AND ps.is_active = true
  AND ps.session_type = 'flashcards';
-- This should return the host's user_id

-- Step 7: If Step 6 returns the host_user_id, test the full query
-- Replace PARTICIPANT_USER_ID with participant's user_id
WITH accessible_hosts AS (
  SELECT ps.host_user_id 
  FROM public.practice_sessions ps
  JOIN public.practice_session_participants psp ON ps.id = psp.session_id
  WHERE psp.user_id = 'PARTICIPANT_USER_ID_HERE'  -- REPLACE THIS
    AND ps.is_active = true
    AND ps.session_type = 'flashcards'
)
SELECT 
  f.id,
  f.front_text,
  f.back_text
FROM flashcards f
WHERE f.user_id IN (SELECT host_user_id FROM accessible_hosts);
-- This should return the host's flashcards

---
-- If any of these fail, tell me which step and what error!
