/**
 * Get the base URL for the application
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (explicitly set)
 * 2. VERCEL_URL (automatically set by Vercel)
 * 3. Throws error in production, uses localhost in development
 */
export function getBaseUrl(): string {
  // First priority: explicit NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL) {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim()
    return url.startsWith('http') ? url : `https://${url}`
  }

  // Second priority: Vercel URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Development fallback
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000'
  }

  // Production: throw error if no URL is configured
  throw new Error(
    'NEXT_PUBLIC_APP_URL or VERCEL_URL must be set in production environment'
  )
}

