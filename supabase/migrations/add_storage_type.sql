-- Add storage_type column to track where files are stored
-- This makes it easier to determine which storage backend to use for operations

-- Add storage_type column (s3 or supabase)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS storage_type VARCHAR(20) DEFAULT 'supabase';

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_documents_storage_type 
ON documents(storage_type);

-- Update existing records based on storage_path pattern
-- S3 paths start with "documents/"
-- Supabase paths start with userId (UUID pattern)
UPDATE documents
SET storage_type = 's3'
WHERE storage_path LIKE 'documents/%';

UPDATE documents
SET storage_type = 'supabase'
WHERE storage_path NOT LIKE 'documents/%' 
  AND storage_type IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN documents.storage_type IS 'Storage backend: s3 (AWS S3) or supabase (Supabase Storage)';

-- View to show storage distribution
CREATE OR REPLACE VIEW storage_stats AS
SELECT 
  storage_type,
  COUNT(*) as document_count,
  SUM(file_size) / 1024 / 1024 as total_size_mb,
  AVG(file_size) / 1024 / 1024 as avg_size_mb
FROM documents
GROUP BY storage_type;

-- Usage example:
-- SELECT * FROM storage_stats;
