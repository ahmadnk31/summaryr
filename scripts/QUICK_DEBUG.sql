-- ALL-IN-ONE DEBUG QUERY
-- Copy and run this entire query - no replacements needed!

WITH current_session AS (
  SELECT 
    id as session_id,
    session_code,
    host_user_id,
    session_type,
    is_active
  FROM practice_sessions 
  WHERE is_active = true 
  ORDER BY created_at DESC 
  LIMIT 1
),
session_participants AS (
  SELECT 
    psp.id as participant_id,
    psp.user_id,
    psp.display_name,
    u.email,
    cs.session_id,
    cs.host_user_id
  FROM practice_session_participants psp
  JOIN auth.users u ON psp.user_id = u.id
  CROSS JOIN current_session cs
  WHERE psp.session_id = cs.session_id
),
host_flashcards AS (
  SELECT 
    cs.host_user_id,
    u.email as host_email,
    COUNT(f.id) as flashcard_count
  FROM current_session cs
  LEFT JOIN flashcards f ON f.user_id = cs.host_user_id
  LEFT JOIN auth.users u ON u.id = cs.host_user_id
  GROUP BY cs.host_user_id, u.email
)

-- RESULTS:
SELECT '=== SESSION INFO ===' as section, * FROM current_session
UNION ALL
SELECT '=== PARTICIPANTS ===' as section, 
  session_id::text, 
  user_id::text, 
  display_name, 
  email,
  host_user_id::text
FROM session_participants
UNION ALL
SELECT '=== HOST FLASHCARDS ===' as section,
  host_user_id::text,
  host_email,
  flashcard_count::text,
  NULL,
  NULL
FROM host_flashcards;

-- SIMPLIFIED: Just show the counts
SELECT 
  'Active Sessions' as metric,
  COUNT(*)::text as value
FROM practice_sessions 
WHERE is_active = true
UNION ALL
SELECT 
  'Total Participants' as metric,
  COUNT(*)::text as value
FROM practice_session_participants psp
JOIN practice_sessions ps ON psp.session_id = ps.id
WHERE ps.is_active = true
UNION ALL
SELECT 
  'Host Flashcards' as metric,
  COUNT(*)::text as value
FROM flashcards f
JOIN practice_sessions ps ON f.user_id = ps.host_user_id
WHERE ps.is_active = true
LIMIT 1;

-- CHECK RLS POLICIES
SELECT 
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN policyname LIKE '%sessions%' THEN '✅ NEW POLICY'
    ELSE '⚠️ OLD POLICY'
  END as status
FROM pg_policies 
WHERE tablename IN ('flashcards', 'questions')
  AND cmd IN ('SELECT', 'UPDATE')
ORDER BY tablename, cmd;
