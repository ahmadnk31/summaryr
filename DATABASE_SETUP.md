# Database Setup for Collaborative Practice

## Quick Setup Instructions

The collaborative practice feature requires three database tables. Follow these steps:

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `scripts/010_create_practice_sessions.sql`
5. Click **Run** or press `Cmd/Ctrl + Enter`
6. Create another new query
7. Copy and paste the contents of `scripts/011_add_increment_score_function.sql`
8. Click **Run**

### Option 2: Command Line (If you have psql)

```bash
# Replace with your actual connection details
psql "postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DATABASE]" \
  -f scripts/010_create_practice_sessions.sql

psql "postgresql://[USER]:[PASSWORD]@[HOST]:5432/[DATABASE]" \
  -f scripts/011_add_increment_score_function.sql
```

### Option 3: Copy-Paste Ready SQL

If you prefer, here's the complete SQL to run in one go:

```sql
-- Run this entire block in Supabase SQL Editor

-- Create practice_sessions table
CREATE TABLE IF NOT EXISTS public.practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL,
  session_name TEXT NOT NULL,
  session_code TEXT UNIQUE NOT NULL,
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

-- Create practice_session_responses table
CREATE TABLE IF NOT EXISTS public.practice_session_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.practice_sessions(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES public.practice_session_participants(id) ON DELETE CASCADE,
  item_id UUID NOT NULL,
  item_type TEXT NOT NULL,
  quality INTEGER NOT NULL,
  response_time_ms INTEGER,
  responded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_session_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies (all in one block)
CREATE POLICY "Authenticated users can view active sessions" ON public.practice_sessions
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND is_active = true
  );

CREATE POLICY "Users can create their own sessions" ON public.practice_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Hosts can update their sessions" ON public.practice_sessions
  FOR UPDATE USING (auth.uid() = host_user_id);

CREATE POLICY "Hosts can delete their sessions" ON public.practice_sessions
  FOR DELETE USING (auth.uid() = host_user_id);

CREATE POLICY "Anyone authenticated can view participants" ON public.practice_session_participants
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can join sessions" ON public.practice_session_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participant record" ON public.practice_session_participants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can leave sessions" ON public.practice_session_participants
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view responses in their sessions" ON public.practice_session_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.practice_session_participants p
      JOIN public.practice_sessions s ON p.session_id = s.id
      WHERE p.id = participant_id AND (s.host_user_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own responses" ON public.practice_session_responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.practice_session_participants WHERE id = participant_id AND user_id = auth.uid())
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_practice_sessions_code ON public.practice_sessions(session_code);
CREATE INDEX IF NOT EXISTS idx_practice_sessions_active ON public.practice_sessions(is_active, expires_at);
CREATE INDEX IF NOT EXISTS idx_practice_session_participants_session ON public.practice_session_participants(session_id);
CREATE INDEX IF NOT EXISTS idx_practice_session_responses_session ON public.practice_session_responses(session_id);

-- Helper functions
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

CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.practice_sessions SET is_active = false WHERE expires_at < NOW() AND is_active = true;
END;
$$ LANGUAGE plpgsql;

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
  SET score = score + p_points, last_active_at = now()
  WHERE session_id = p_session_id AND user_id = p_user_id;
END;
$$;
```

## Verify Installation

After running the SQL, verify it worked:

```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('practice_sessions', 'practice_session_participants', 'practice_session_responses');

-- Should return 3 rows
```

## Enable Realtime (Important!)

1. Go to **Database** → **Replication** in Supabase
2. Enable replication for:
   - ✅ `practice_sessions`
   - ✅ `practice_session_participants`
   - ✅ `practice_session_responses`

## Troubleshooting

### Error: "relation does not exist"
- Tables haven't been created yet
- Run the SQL scripts above

### Error: "permission denied"
- Check RLS policies are created
- Ensure you're authenticated

### Error: "function does not exist"
- Run the `increment_participant_score` function SQL

## Done! ✅

Once the tables are created and realtime is enabled, the collaborative practice feature will work perfectly!
