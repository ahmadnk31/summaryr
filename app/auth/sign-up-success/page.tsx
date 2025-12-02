"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Mail, Loader2 } from "lucide-react"
import { toast } from "sonner"

export default function Page() {
  const [isResending, setIsResending] = useState(false)
  const [email, setEmail] = useState("")

  // Get email from URL params or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const emailParam = params.get("email")
      if (emailParam) {
        setEmail(emailParam)
        localStorage.setItem("signup_email", emailParam)
      } else {
        const storedEmail = localStorage.getItem("signup_email")
        if (storedEmail) {
          setEmail(storedEmail)
        }
      }
    }
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

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Mail className="h-6 w-6" />
              Check your email
            </CardTitle>
            <CardDescription>We sent you a verification link</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Please check your email and click the verification link to activate your account before signing in.
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
                variant="outline"
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
              <Button asChild className="w-full">
                <Link href="/auth/login">Back to Login</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
