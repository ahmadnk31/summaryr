"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import Link from "next/link"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const token = searchParams.get("token")
    
    if (!token) {
      setStatus("error")
      setErrorMessage("Verification token is missing")
      return
    }

    // Verify the token
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (response) => {
        if (response.redirected) {
          // Redirect to success page
          window.location.href = response.url
          return
        }
        
        const data = await response.json()
        if (!response.ok) {
          setStatus("error")
          setErrorMessage(data.error || "Failed to verify email")
        } else {
          setStatus("success")
          setTimeout(() => {
            router.push("/auth/verify-email-success")
          }, 2000)
        }
      })
      .catch((error) => {
        console.error("Verification error:", error)
        setStatus("error")
        setErrorMessage("An error occurred while verifying your email")
      })
  }, [searchParams, router])

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              {status === "loading" && <Loader2 className="h-6 w-6 animate-spin" />}
              {status === "success" && <CheckCircle2 className="h-6 w-6 text-green-500" />}
              {status === "error" && <XCircle className="h-6 w-6 text-destructive" />}
              Email Verification
            </CardTitle>
            <CardDescription>
              {status === "loading" && "Verifying your email address..."}
              {status === "success" && "Email verified successfully!"}
              {status === "error" && "Verification failed"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {status === "loading" && (
              <p className="text-sm text-muted-foreground">
                Please wait while we verify your email address.
              </p>
            )}
            {status === "success" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your email has been verified successfully! You can now sign in to your account.
                </p>
                <Button asChild className="w-full">
                  <Link href="/auth/login">Go to Login</Link>
                </Button>
              </div>
            )}
            {status === "error" && (
              <div className="space-y-4">
                <p className="text-sm text-destructive">{errorMessage}</p>
                <div className="space-y-2">
                  <Button asChild className="w-full" variant="outline">
                    <Link href="/auth/sign-up">Sign Up Again</Link>
                  </Button>
                  <Button asChild className="w-full">
                    <Link href="/auth/login">Back to Login</Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-sm">
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  Email Verification
                </CardTitle>
                <CardDescription>Loading...</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Please wait while we load the verification page.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}

