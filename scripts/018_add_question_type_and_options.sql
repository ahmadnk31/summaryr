-- Add question_type and options columns to questions table
-- This enables support for different question formats: MCQ, True/False, Fill-in-blank, etc.

-- Add question_type column with default 'short_answer' for existing questions
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS question_type TEXT DEFAULT 'short_answer';

-- Add options column to store MCQ choices as JSONB array
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS options JSONB DEFAULT NULL;

-- Add check constraint for valid question types
ALTER TABLE public.questions 
DROP CONSTRAINT IF EXISTS valid_question_type;

ALTER TABLE public.questions 
ADD CONSTRAINT valid_question_type 
CHECK (question_type IN ('multiple_choice', 'short_answer', 'true_false', 'essay', 'fill_blank'));

-- Update existing questions to have proper type
UPDATE public.questions 
SET question_type = 'short_answer' 
WHERE question_type IS NULL;

-- Create index for faster filtering by type
CREATE INDEX IF NOT EXISTS idx_questions_type ON public.questions(question_type);
