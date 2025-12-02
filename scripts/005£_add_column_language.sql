-- Add language column to documents table
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS language VARCHAR(10) DEFAULT 'en';

-- Add index for language queries
CREATE INDEX IF NOT EXISTS idx_documents_language ON documents(language);
