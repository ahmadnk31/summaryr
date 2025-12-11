import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentViewerClient } from "@/components/document-viewer-client"
import { WebDocumentViewerClient } from "@/components/web-document-viewer-client"
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

  // Use separate components: WebDocumentViewerClient for web documents, DocumentViewerClient for PDFs
  if (isWebDocument(document)) {
    // Web content - use dedicated web viewer with sidebar
    return <WebDocumentViewerClient document={document} />
  }

  // PDF/uploaded documents - use full-featured document viewer with AI tools
  return <DocumentViewerClient document={document} />
}
