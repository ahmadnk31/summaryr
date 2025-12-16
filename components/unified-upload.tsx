"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocumentUploadS3 } from "./document-upload-s3"
import { WebScraper } from "./web-scraper"
import { Upload, Globe } from "lucide-react"

export function UnifiedUpload({ planTier = 'free', documentCount = 0 }: { planTier?: string; documentCount?: number }) {
  const [activeTab, setActiveTab] = useState("file")

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="file" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload File
          </TabsTrigger>
          <TabsTrigger value="web" className="flex items-center gap-2" disabled={planTier === 'free'} title={planTier === 'free' ? "Upgrade to Pro to scrape web pages" : ""}>
            <Globe className="h-4 w-4" />
            Scrape Web Page {planTier === 'free' && <span className="ml-2 text-xs bg-muted text-primary px-1.5 py-0.5 rounded-full">Pro</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="mt-6">
          <DocumentUploadS3 planTier={planTier} documentCount={documentCount} />
        </TabsContent>

        <TabsContent value="web" className="mt-6">
          <WebScraper />
        </TabsContent>
      </Tabs>
    </div>
  )
}
