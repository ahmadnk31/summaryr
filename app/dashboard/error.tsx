'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error:', error)
  }, [error])

  const isMissingEnvVars = error.message.includes('Missing Supabase environment variables') || 
                           error.message.includes('URL and Key are required')

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-2xl">
                {isMissingEnvVars ? 'Configuration Required' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isMissingEnvVars 
                  ? 'Supabase environment variables are not configured'
                  : 'An error occurred while loading the dashboard'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isMissingEnvVars ? (
            <>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">
                  To use this application, you need to configure your Supabase credentials. 
                  Please create a <code className="px-1.5 py-0.5 bg-background rounded text-xs">.env.local</code> file 
                  in the root directory with the following variables:
                </p>
                <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                  <code>{`NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key`}</code>
                </pre>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Where to find these values:</strong>
                </p>
                <ol className="text-sm text-blue-900 dark:text-blue-100 list-decimal list-inside mt-2 space-y-1">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to Settings → API</li>
                  <li>Copy the URL and anon/public key</li>
                  <li>For the service role key, look under "Project API keys"</li>
                </ol>
              </div>
              <p className="text-sm text-muted-foreground">
                After adding the environment variables, restart your development server.
              </p>
            </>
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                {error.message || 'An unexpected error occurred. Please try again.'}
              </p>
            </div>
          )}
          
          <div className="flex gap-3 pt-2">
            <Button onClick={reset} variant="default" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try again
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Go home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
