import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentViewerClient } from "@/components/document-viewer-client"
import { EnhancedDocumentRendererClient } from "@/components/enhanced-document-renderer-client"
import { getDocumentContent } from "@/app/actions/get-document-content"
import { isWebDocument } from "@/lib/web-document-helpers"

export default async function DocumentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ fullscreen?: string }>
}) {
  const { id } = await params
  const { fullscreen } = await searchParams

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect("/auth/login")
  }

  // Check if user exists in email_verifications table and is verified
  const { data: verification } = await supabase
    .from("email_verifications")
    .select("verified")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // User must exist in email_verifications table and be verified
  if (!verification || verification.verified !== true) {
    redirect("/auth/verify-email-required")
  }

  // Get document content (handles S3 downloads if needed)
  const { content, document, error } = await getDocumentContent(id)

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Document Not Found</h1>
          <p className="text-muted-foreground">
            {error || "This document doesn't exist or you don't have access to it."}
          </p>
          <a href="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  // Update last accessed timestamp
  await supabase.from("documents").update({ last_accessed: new Date().toISOString() }).eq("id", id)

  // Use separate components: EnhancedDocumentRenderer for web documents, DocumentViewerClient for PDFs
  if (isWebDocument(document)) {
    // Web content - use dedicated web renderer with markdown support
    return (
      <div className="min-h-screen bg-background">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-semibold truncate">{document.title}</h1>
              <p className="text-sm text-muted-foreground">
                Web Content • {new Date(document.upload_date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/documents"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                Back to Documents
              </a>
            </div>
          </div>
        </div>
        
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <EnhancedDocumentRenderer document={document} />
        </main>
      </div>
    )
  }

  // PDF/uploaded documents - use full-featured document viewer with AI tools
  return <DocumentViewerClient document={document} />
}
