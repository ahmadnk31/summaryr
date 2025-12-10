export interface Document {
  id: string
  user_id: string
  title: string
  file_name: string
  file_type: string
  file_size: number
  extracted_text: string
  page_count: number
  upload_date: string
  last_accessed: string
  storage_path: string
  storage_type?: 's3' | 'supabase'
}

export interface Flashcard {
  id: string
  user_id: string
  document_id: string | null
  front_text: string
  back_text: string
  source_text: string | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  user_id: string
  document_id: string | null
  question_text: string
  answer_text: string
  source_text: string | null
  difficulty: string
  question_type: 'multiple_choice' | 'short_answer' | 'true_false' | 'essay' | 'fill_blank'
  options?: string[]
  created_at: string
}

export interface Summary {
  id: string
  user_id: string
  document_id: string | null
  original_text: string
  summary_text: string
  summary_type: string
  created_at: string
}

export interface Explanation {
  id: string
  user_id: string
  document_id: string | null
  original_text: string
  explanation_text: string
  language: string
  created_at: string
}

export interface Note {
  id: string
  user_id: string
  document_id: string | null
  title: string
  content: string
  selected_text: string | null
  position_start: number | null
  position_end: number | null
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  document_id: string | null
  user_message: string
  assistant_message: string
  created_at: string
}
