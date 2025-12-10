"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Globe, Loader2, ExternalLink, CheckCircle, AlertCircle } from "lucide-react"
import { processWebPage } from "@/app/actions/process-webpage"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { validateUrl } from "@/lib/web-scraper"

// Helper function to format numbers consistently (avoiding hydration mismatch)
const formatNumber = (num: number): string => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

interface ScrapedContentPreview {
  title: string
  wordCount: number
  summary: string
  keyTopics: string[]
  contentType: string
}

export function WebScraper() {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ScrapedContentPreview | null>(null)
  const [urlValidation, setUrlValidation] = useState<{ isValid: boolean; error?: string } | null>(null)
  
  const router = useRouter()

  const handleUrlChange = (value: string) => {
    setUrl(value)
    setError(null)
    setPreview(null)
    
    if (value.trim()) {
      const validation = validateUrl(value)
      setUrlValidation(validation)
    } else {
      setUrlValidation(null)
    }
  }

  const handleScrape = async () => {
    if (!url.trim()) {
      setError("Please enter a URL")
      return
    }

    const validation = validateUrl(url)
    if (!validation.isValid) {
      setError(validation.error || "Invalid URL")
      return
    }

    setIsLoading(true)
    setError(null)
    setPreview(null)

    try {
      const result = await processWebPage({
        url: url.trim(),
        title: title.trim() || undefined,
      })

      if (result.error) {
        setError(result.error)
      } else if (result.success && result.documentId) {
        // Show preview first
        if (result.scrapedContent) {
          setPreview(result.scrapedContent)
        }
        
        // Redirect after a short delay to show success
        setTimeout(() => {
          router.push(`/documents/${result.documentId}`)
        }, 2000)
      }
    } catch (err) {
      console.error("Scraping error:", err)
      setError(err instanceof Error ? err.message : "Failed to scrape web page")
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleScrape()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Web Page Scraper
          <span className="text-xs font-normal text-muted-foreground flex items-center gap-1 ml-auto">
            Powered by OpenAI
          </span>
        </CardTitle>
        <CardDescription>
          Extract content from any web page and convert it into a study document
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="url">Web Page URL</Label>
          <div className="relative">
            <Input
              id="url"
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
              className={cn(
                urlValidation?.isValid === false && "border-destructive focus:border-destructive",
                urlValidation?.isValid === true && "border-green-500 focus:border-green-500"
              )}
            />
            {urlValidation && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {urlValidation.isValid ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-destructive" />
                )}
              </div>
            )}
          </div>
          {urlValidation?.error && (
            <p className="text-sm text-destructive">{urlValidation.error}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Custom Title (Optional)</Label>
          <Input
            id="title"
            placeholder="Override the page title if needed"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isLoading}
          />
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </p>
          </div>
        )}

        {preview && (
          <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-md">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                Successfully extracted content!
              </span>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">Title:</span> {preview.title}
              </div>
              <div>
                <span className="font-medium">Content Type:</span> {preview.contentType}
              </div>
              <div>
                <span className="font-medium">Word Count:</span> {formatNumber(preview.wordCount)} words
                {preview.wordCount > 5000 && <span className="text-green-600"> • Comprehensive content extracted!</span>}
              </div>
              {preview.keyTopics.length > 0 && (
                <div>
                  <span className="font-medium">Key Topics:</span> {preview.keyTopics.slice(0, 3).join(', ')}
                  {preview.keyTopics.length > 3 && ` +${preview.keyTopics.length - 3} more`}
                </div>
              )}
              {preview.summary && (
                <div>
                  <span className="font-medium">Summary:</span> {preview.summary}
                </div>
              )}
            </div>
            <p className="text-xs text-green-700 dark:text-green-300 mt-2">
              Redirecting to document view...
            </p>
          </div>
        )}

        <Button
          onClick={handleScrape}
          disabled={isLoading || !url.trim() || urlValidation?.isValid === false}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Scraping web page...
            </>
          ) : (
            <>
              <Globe className="mr-2 h-4 w-4" />
              Extract Content
            </>
          )}
        </Button>

        <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
          <p className="font-medium mb-1">How it works:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Fetches the web page content</li>
            <li>Uses AI to extract main article content and remove clutter</li>
            <li>Identifies key topics and generates a summary</li>
            <li>Saves as a document for study and note-taking</li>
          </ul>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <span className="text-xs text-muted-foreground">
            Supports articles, blogs, documentation, and news pages
          </span>
          <ExternalLink className="h-3 w-3 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  )
}
