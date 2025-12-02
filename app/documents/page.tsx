import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Plus, Upload } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { DocumentsList } from "@/components/documents-list"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'My Documents',
  description: 'View and manage all your uploaded documents. Access your PDFs, DOCX files, and EPUB documents in one place.',
  robots: {
    index: false,
    follow: false,
  },
}

export default async function DocumentsPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
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

  // Fetch all documents
  const { data: documents } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("upload_date", { ascending: false })

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-background sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Image src="/logo.png" alt="Summaryr Logo" width={24} height={24} className="h-6 w-6" />
              <h1 className="text-xl font-semibold">My Documents</h1>
            </div>
          </div>
          <Button asChild>
            <Link href="/dashboard">
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>All Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsList documents={documents || []} />
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

