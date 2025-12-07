"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { DashboardNavbar } from "@/components/dashboard-navbar"
import { JoinPracticeSession } from "@/components/join-practice-session"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function JoinPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code")

  useEffect(() => {
    if (code) {
      // Auto-redirect to session page if code is in URL
      router.push(`/practice/session/${code}`)
    }
  }, [code, router])

  if (code) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
        <DashboardNavbar />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      <DashboardNavbar />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          <JoinPracticeSession />
        </div>
      </main>
    </div>
  )
}
