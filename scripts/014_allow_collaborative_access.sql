-- Update RLS policies to allow collaborative practice sessions
-- Participants need to view the host's flashcards and questions

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can view their own questions" ON public.questions;

-- Create new policies that allow viewing own items OR items from session hosts
CREATE POLICY "Users can view their own flashcards or flashcards from sessions they're in" ON public.flashcards
  FOR SELECT USING (
    -- Users can view their own flashcards
    auth.uid() = user_id 
    OR
    -- Users can view flashcards from hosts of sessions they're participating in
    user_id IN (
      SELECT ps.host_user_id 
      FROM public.practice_sessions ps
      JOIN public.practice_session_participants psp ON ps.id = psp.session_id
      WHERE psp.user_id = auth.uid() 
        AND ps.is_active = true
        AND ps.session_type = 'flashcards'
    )
  );

CREATE POLICY "Users can view their own questions or questions from sessions they're in" ON public.questions
  FOR SELECT USING (
    -- Users can view their own questions
    auth.uid() = user_id 
    OR
    -- Users can view questions from hosts of sessions they're participating in
    user_id IN (
      SELECT ps.host_user_id 
      FROM public.practice_sessions ps
      JOIN public.practice_session_participants psp ON ps.id = psp.session_id
      WHERE psp.user_id = auth.uid() 
        AND ps.is_active = true
        AND ps.session_type = 'questions'
    )
  );

-- Also allow participants to update flashcards/questions during practice (for spaced repetition)
DROP POLICY IF EXISTS "Users can update their own flashcards" ON public.flashcards;
DROP POLICY IF EXISTS "Users can update their own questions" ON public.questions;

CREATE POLICY "Users can update their own flashcards or flashcards in active sessions" ON public.flashcards
  FOR UPDATE USING (
    -- Users can update their own flashcards
    auth.uid() = user_id 
    OR
    -- Users can update flashcards during active practice sessions
    user_id IN (
      SELECT ps.host_user_id 
      FROM public.practice_sessions ps
      JOIN public.practice_session_participants psp ON ps.id = psp.session_id
      WHERE psp.user_id = auth.uid() 
        AND ps.is_active = true
        AND ps.session_type = 'flashcards'
    )
  );

CREATE POLICY "Users can update their own questions or questions in active sessions" ON public.questions
  FOR UPDATE USING (
    -- Users can update their own questions
    auth.uid() = user_id 
    OR
    -- Users can update questions during active practice sessions
    user_id IN (
      SELECT ps.host_user_id 
      FROM public.practice_sessions ps
      JOIN public.practice_session_participants psp ON ps.id = psp.session_id
      WHERE psp.user_id = auth.uid() 
        AND ps.is_active = true
        AND ps.session_type = 'questions'
    )
  );

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename IN ('flashcards', 'questions')
  AND cmd IN ('SELECT', 'UPDATE')
ORDER BY tablename, cmd;
