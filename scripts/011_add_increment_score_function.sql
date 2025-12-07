-- Add function to increment participant score
CREATE OR REPLACE FUNCTION increment_participant_score(
  p_session_id uuid,
  p_user_id uuid,
  p_points integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE practice_session_participants
  SET 
    score = score + p_points,
    last_active_at = now()
  WHERE session_id = p_session_id 
    AND user_id = p_user_id;
END;
$$;
