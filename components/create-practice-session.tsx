"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Users, Copy, Check, ExternalLink, Clock } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface Document {
  id: string
  title: string
}

export function CreatePracticeSession() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [sessionName, setSessionName] = useState("")
  const [sessionType, setSessionType] = useState<"flashcards" | "questions">("flashcards")
  const [selectedDocumentId, setSelectedDocumentId] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [sessionCode, setSessionCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    loadDocuments()
  }, [])

  const loadDocuments = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from("documents")
        .select("id, title")
        .eq("user_id", user.id)
        .order("upload_date", { ascending: false })

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error("Error loading documents:", error)
    }
  }

  const generateSessionCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = ''
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)]
    }
    return code
  }

  const createSession = async () => {
    if (!sessionName.trim()) {
      toast.error("Please enter a session name")
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      const code = generateSessionCode()

      const { data, error } = await supabase
        .from("practice_sessions")
        .insert({
          host_user_id: user.id,
          document_id: selectedDocumentId === "all" ? null : selectedDocumentId,
          session_type: sessionType,
          session_name: sessionName,
          session_code: code,
        })
        .select()
        .single()

      if (error) {
        console.error("Error inserting session:", error)
        throw new Error(`Failed to create session: ${error.message}`)
      }

      if (!data) {
        throw new Error("No session data returned")
      }

      // Join as host
      const { error: participantError } = await supabase
        .from("practice_session_participants")
        .insert({
          session_id: data.id,
          user_id: user.id,
          display_name: user.email?.split("@")[0] || "Host",
        })

      if (participantError) {
        console.error("Error joining as participant:", participantError)
        throw new Error(`Failed to join session: ${participantError.message}`)
      }

      setSessionCode(code)
      toast.success("Practice session created!")
    } catch (error) {
      console.error("Error creating session:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create session"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const copySessionLink = () => {
    if (!sessionCode) return
    const link = `${window.location.origin}/practice/join?code=${sessionCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    toast.success("Link copied to clipboard!")
    setTimeout(() => setCopied(false), 2000)
  }

  const joinSession = () => {
    if (!sessionCode) return
    router.push(`/practice/session/${sessionCode}`)
  }

  if (sessionCode) {
    const sessionLink = `${window.location.origin}/practice/join?code=${sessionCode}`
    
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Session Created!
          </CardTitle>
          <CardDescription>Share this link with others to practice together</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Session Code</Label>
            <div className="flex items-center gap-2">
              <Input value={sessionCode} readOnly className="font-mono text-2xl text-center" />
              <Button variant="outline" size="icon" onClick={copySessionLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Share Link</Label>
            <div className="flex items-center gap-2">
              <Input value={sessionLink} readOnly className="text-sm" />
              <Button variant="outline" size="icon" onClick={copySessionLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="p-4 bg-primary/5 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              <Clock className="w-4 h-4 inline mr-1" />
              Session expires in 24 hours
            </p>
            <p className="text-sm text-muted-foreground">
              <Users className="w-4 h-4 inline mr-1" />
              Up to 10 participants can join
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button onClick={joinSession} className="flex-1">
            <ExternalLink className="w-4 h-4 mr-2" />
            Start Session
          </Button>
          <Button variant="outline" onClick={() => setSessionCode(null)}>
            Create Another
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Create Practice Session
        </CardTitle>
        <CardDescription>
          Create a collaborative study session and invite others to practice together
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="session-name">Session Name</Label>
          <Input
            id="session-name"
            placeholder="e.g., Study Group - Chapter 5"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="session-type">Practice Type</Label>
          <Select value={sessionType} onValueChange={(v: "flashcards" | "questions") => setSessionType(v)}>
            <SelectTrigger id="session-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="flashcards">Flashcards</SelectItem>
              <SelectItem value="questions">Questions</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document">Document (Optional)</Label>
          <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
            <SelectTrigger id="document">
              <SelectValue placeholder="All documents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All documents</SelectItem>
              {documents.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={createSession} disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Session"}
        </Button>
      </CardFooter>
    </Card>
  )
}
