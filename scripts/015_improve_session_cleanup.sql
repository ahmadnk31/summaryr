-- Migration: Improve session cleanup and cascade deletes
-- This ensures that when a session ends, related data is properly cleaned up

-- Drop existing foreign keys if they exist
ALTER TABLE practice_session_participants 
DROP CONSTRAINT IF EXISTS practice_session_participants_session_id_fkey;

ALTER TABLE practice_session_responses 
DROP CONSTRAINT IF EXISTS practice_session_responses_session_id_fkey;

ALTER TABLE practice_session_responses 
DROP CONSTRAINT IF EXISTS practice_session_responses_participant_id_fkey;

-- Re-add foreign keys with CASCADE DELETE
-- When a session is deleted, all participants are automatically removed
ALTER TABLE practice_session_participants
ADD CONSTRAINT practice_session_participants_session_id_fkey
FOREIGN KEY (session_id)
REFERENCES practice_sessions(id)
ON DELETE CASCADE;

-- When a session is deleted, all responses are automatically removed
ALTER TABLE practice_session_responses
ADD CONSTRAINT practice_session_responses_session_id_fkey
FOREIGN KEY (session_id)
REFERENCES practice_sessions(id)
ON DELETE CASCADE;

-- When a participant is removed, all their responses are automatically removed
ALTER TABLE practice_session_responses
ADD CONSTRAINT practice_session_responses_participant_id_fkey
FOREIGN KEY (participant_id)
REFERENCES practice_session_participants(id)
ON DELETE CASCADE;

-- Create a function to automatically clean up old inactive sessions
-- This will run daily to remove sessions that ended more than 7 days ago
CREATE OR REPLACE FUNCTION cleanup_old_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete sessions that are inactive and older than 7 days
  DELETE FROM practice_sessions
  WHERE is_active = false
  AND created_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cleanup_old_sessions() TO authenticated;

-- Optional: Create a scheduled job to run cleanup daily
-- Note: This requires pg_cron extension. Comment out if not available.
-- SELECT cron.schedule('cleanup-old-sessions', '0 2 * * *', 'SELECT cleanup_old_sessions()');

-- Add index for better performance on session lookups
CREATE INDEX IF NOT EXISTS idx_practice_sessions_active 
ON practice_sessions(is_active, created_at) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_practice_session_participants_session 
ON practice_session_participants(session_id, user_id);
