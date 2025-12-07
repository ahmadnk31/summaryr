-- Add spaced repetition columns to flashcards table
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS repetition_count INTEGER DEFAULT 0;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS easiness_factor DECIMAL(3,2) DEFAULT 2.5;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 0;
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.flashcards ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Add spaced repetition columns to questions table
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS repetition_count INTEGER DEFAULT 0;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS easiness_factor DECIMAL(3,2) DEFAULT 2.5;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS interval_days INTEGER DEFAULT 0;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS next_review_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS last_reviewed_at TIMESTAMP WITH TIME ZONE;

-- Create review_history table to track user performance
CREATE TABLE IF NOT EXISTS public.review_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL, -- 'flashcard' or 'question'
  item_id UUID NOT NULL,
  quality INTEGER NOT NULL, -- 0-5 rating (SM-2 algorithm)
  reviewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for review_history
ALTER TABLE public.review_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for review_history
CREATE POLICY "Users can view their own review history" ON public.review_history
  FOR SELECT USING (auth.uid() = user_id);
yes
CREATE POLICY "Users can insert their own review history" ON public.review_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own review history" ON public.review_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_flashcards_next_review ON public.flashcards(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_questions_next_review ON public.questions(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_review_history_user ON public.review_history(user_id, reviewed_at DESC);
