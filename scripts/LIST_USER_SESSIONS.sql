-- Query to list all sessions created by the current user
-- Run this in Supabase SQL Editor while logged in

SELECT 
  ps.id,
  ps.session_code,
  ps.session_name,
  ps.session_type,
  ps.is_active,
  ps.created_at,
  ps.expires_at,
  COUNT(psp.id) as participant_count,
  ps.host_user_id,
  auth.uid() as current_user_id,
  (ps.host_user_id = auth.uid()) as is_your_session
FROM practice_sessions ps
LEFT JOIN practice_session_participants psp ON ps.id = psp.session_id
WHERE ps.host_user_id = auth.uid()
GROUP BY ps.id, ps.session_code, ps.session_name, ps.session_type, ps.is_active, ps.created_at, ps.expires_at, ps.host_user_id
ORDER BY ps.created_at DESC;

-- See active sessions only
SELECT 
  ps.session_code,
  ps.session_name,
  ps.session_type,
  COUNT(psp.id) as participant_count,
  ps.created_at
FROM practice_sessions ps
LEFT JOIN practice_session_participants psp ON ps.id = psp.session_id
WHERE ps.host_user_id = auth.uid()
  AND ps.is_active = true
GROUP BY ps.id, ps.session_code, ps.session_name, ps.session_type, ps.created_at
ORDER BY ps.created_at DESC;

-- See session details with participant names
SELECT 
  ps.session_code,
  ps.session_name,
  ps.is_active,
  u.email as participant_email,
  psp.display_name,
  psp.score,
  psp.joined_at
FROM practice_sessions ps
LEFT JOIN practice_session_participants psp ON ps.id = psp.session_id
LEFT JOIN auth.users u ON psp.user_id = u.id
WHERE ps.host_user_id = auth.uid()
ORDER BY ps.created_at DESC, psp.score DESC;
