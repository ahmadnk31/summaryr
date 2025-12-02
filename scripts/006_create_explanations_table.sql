-- Create explanations table
CREATE TABLE IF NOT EXISTS public.explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  original_text TEXT NOT NULL,
  explanation_text TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.explanations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for explanations
CREATE POLICY "Users can view their own explanations" ON public.explanations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own explanations" ON public.explanations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own explanations" ON public.explanations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own explanations" ON public.explanations
  FOR DELETE USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_explanations_document_id ON public.explanations(document_id);
CREATE INDEX IF NOT EXISTS idx_explanations_user_id ON public.explanations(user_id);

