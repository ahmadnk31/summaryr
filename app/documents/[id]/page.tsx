import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DocumentViewerClient } from "@/components/document-viewer-client"

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

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

  const { data: document, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (error || !document) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Document Not Found</h1>
          <p className="text-muted-foreground">
            {error ? `Error: ${error.message}` : "This document doesn't exist or you don't have access to it."}
          </p>
          <a href="/dashboard" className="text-primary hover:underline">
            Return to Dashboard
          </a>
        </div>
      </div>
    )
  }

  await supabase.from("documents").update({ last_accessed: new Date().toISOString() }).eq("id", id)

  return <DocumentViewerClient document={document} />
}
