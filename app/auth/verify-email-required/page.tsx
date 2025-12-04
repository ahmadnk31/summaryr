"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Mail, Loader2, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"

export default function VerifyEmailRequiredPage() {
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get user email and check if verified
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email)
        // Store in localStorage for resend functionality
        if (typeof window !== "undefined") {
          localStorage.setItem("signup_email", user.email)
        }

        // Check if user is verified in email_verifications table
        const { data: verification } = await supabase
          .from("email_verifications")
          .select("verified")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        // If verified, redirect to dashboard
        if (verification?.verified === true) {
          window.location.href = "/dashboard"
          return
        }
      }
      setIsLoading(false)
    })
  }, [])

  const handleResendVerification = async () => {
    if (!email) {
      toast.error("Email address not found")
      return
    }

    setIsResending(true)
    try {
      const response = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send verification email")
      }

      toast.success("Verification email sent! Please check your inbox.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send verification email")
    } finally {
      setIsResending(false)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = "/auth/login"
  }

  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
        <div className="w-full max-w-sm">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <AlertCircle className="h-6 w-6 text-yellow-500" />
              Email Verification Required
            </CardTitle>
            <CardDescription>Please verify your email to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your email address needs to be verified before you can access your dashboard. 
              Please check your inbox for the verification link.
            </p>
            {email && (
              <p className="text-sm text-muted-foreground">
                Verification email sent to: <strong>{email}</strong>
              </p>
            )}
            <div className="space-y-2">
              <Button
                onClick={handleResendVerification}
                disabled={isResending || !email}
                className="w-full"
              >
                {isResending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

