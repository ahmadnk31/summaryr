-- Fix infinite recursion in practice_session_participants RLS policy
-- Run this if you already created the tables with the old policy

-- Drop ALL existing SELECT policies on practice_session_participants
DROP POLICY IF EXISTS "Users can view participants in sessions they're in" ON public.practice_session_participants;
DROP POLICY IF EXISTS "Users can view participants in their sessions" ON public.practice_session_participants;
DROP POLICY IF EXISTS "Users can view participants in sessions" ON public.practice_session_participants;
DROP POLICY IF EXISTS "Anyone authenticated can view participants" ON public.practice_session_participants;

-- Create the corrected policy (allows any authenticated user to view participants)
CREATE POLICY "Anyone authenticated can view participants" ON public.practice_session_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Verify the policy
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'practice_session_participants';
