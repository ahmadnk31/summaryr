-- Create practice_sessions table for collaborative study
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL, -- 'flashcards' or 'questions'
  session_name TEXT NOT NULL,
  session_code TEXT UNIQUE NOT NULL, -- Short code for sharing
  max_participants INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Create practice_session_participants table
CREATE TABLE IF NOT EXISTS public.practice_session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  score INTEGER DEFAULT 0,
  UNIQUE(session_id, user_id)
);

-- Create practice_session_responses table to track individual responses
CREATE TABLE IF NOT EXISTS public.practice_session_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.practice_session_participants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL, -- flashcard or question id
  item_type TEXT NOT NULL, -- 'flashcard' or 'question'
  quality INTEGER NOT NULL, -- 0-5 rating
  response_time_ms INTEGER, -- Time taken to respond
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for practice_sessions
CREATE POLICY "Users can view sessions they created or joined" ON public.practice_sessions
  FOR SELECT USING (
    auth.uid() = host_user_id OR 
    EXISTS (
      SELECT 1 FROM public.practice_session_participants 
      WHERE session_id = id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their sessions" ON public.practice_sessions
  FOR UPDATE USING (auth.uid() = host_user_id);

CREATE POLICY "Hosts can delete their sessions" ON public.practice_sessions
  FOR DELETE USING (auth.uid() = host_user_id);

-- RLS Policies for practice_session_participants
CREATE POLICY "Users can view participants in sessions they're in" ON public.practice_session_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.practice_sessions 
      WHERE id = session_id AND (
        host_user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.practice_session_participants 
          WHERE session_id = practice_sessions.id AND user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can join sessions" ON public.practice_session_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant record" ON public.practice_session_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions" ON public.practice_session_participants
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for practice_session_responses
CREATE POLICY "Users can view responses in their sessions" ON public.practice_session_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.practice_session_participants p
      JOIN public.practice_sessions s ON p.session_id = s.id
      WHERE p.id = participant_id AND (
        s.host_user_id = auth.uid() OR
        p.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own responses" ON public.practice_session_responses
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.practice_session_participants 
      WHERE id = participant_id AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_practice_sessions_code ON public.practice_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_active ON public.practice_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_practice_session_participants_session ON public.practice_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_session_responses_session ON public.practice_session_responses(session_id);

-- Function to generate unique session code
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.practice_sessions
  SET is_active = false
  WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;
