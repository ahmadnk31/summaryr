-- Add storage_path column to documents table to reference Supabase Storage
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS storage_path TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_storage_path ON documents(storage_path);
