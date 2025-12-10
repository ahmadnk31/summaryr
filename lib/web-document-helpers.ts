export interface WebDocumentMetadata {
  originalTitle?: string
  sourceUrl?: string
  author?: string
  publishedDate?: string
  summary?: string
  wordCount?: number
  contentType?: string
  keyTopics?: string[]
}

export function extractWebMetadata(extractedText: string | null): WebDocumentMetadata | null {
  if (!extractedText || typeof extractedText !== 'string') {
    return null
  }
  const metadataMatch = extractedText.match(/<!-- WEB_METADATA: ([\s\S]*?) -->/)
  if (metadataMatch) {
    try {
      return JSON.parse(metadataMatch[1])
    } catch {
      return null
    }
  }
  const lines = extractedText.split('\n').filter(line => line.trim())
  const metadata: WebDocumentMetadata = {}
  for (const line of lines.slice(0, 20)) {
    if (line.match(/^(Title|Author|Published|Source):/i)) {
      const [key, ...valueParts] = line.split(':')
      const value = valueParts.join(':').trim()
      const normalizedKey = key.trim().toLowerCase()
      if (normalizedKey === 'source') metadata.sourceUrl = value
      else if (normalizedKey === 'author') metadata.author = value
      else if (normalizedKey === 'published') metadata.publishedDate = value
      else if (normalizedKey === 'title') metadata.originalTitle = value
    }
  }
  return Object.keys(metadata).length > 0 ? metadata : null
}

export function getCleanWebContent(extractedText: string | null): string {
  if (!extractedText || typeof extractedText !== 'string') {
    return '';
  }
  return extractedText.replace(/<!-- WEB_METADATA: [\s\S]*? -->\n\n/, '');
}

export function isWebDocument(document: { file_type: string; storage_type?: string }): boolean {
  return document.file_type === 'url' || document.file_type === 'webpage';
}

export function formatWebDocumentInfo(extractedText: string | null): {
  metadata: WebDocumentMetadata | null;
  content: string;
  displayTitle: string;
  sourceInfo: string;
} {
  const metadata = extractWebMetadata(extractedText);
  const content = getCleanWebContent(extractedText);
  const displayTitle = metadata?.originalTitle || 'Web Page';
  const sourceInfo = metadata?.sourceUrl ? `Source: ${metadata.sourceUrl}` : 'Web Content';
  return { metadata, content, displayTitle, sourceInfo };
}
