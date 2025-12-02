import { MetadataRoute } from 'next'

function getBaseUrl(): string {
  // First priority: explicit NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
    const url = process.env.NEXT_PUBLIC_APP_URL.trim()
    // Ensure it has protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }
  
  // Second priority: Vercel URL
  if (process.env.VERCEL_URL && process.env.VERCEL_URL.trim() !== '') {
    const url = process.env.VERCEL_URL.trim()
    // Ensure it has protocol
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url
    }
    return `https://${url}`
  }
  
  // Fallback
  return 'https://summaryr.com'
}

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl()

  // Ensure sitemap URL is a valid absolute URL
  let sitemapUrl: string
  try {
    // Validate that baseUrl is a proper URL
    const url = new URL(baseUrl)
    sitemapUrl = `${url.origin}/sitemap.xml`
  } catch {
    // Fallback to string concatenation if URL construction fails
    // Ensure no double slashes
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
    sitemapUrl = `${cleanBaseUrl}/sitemap.xml`
  }

  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/dashboard',
          '/documents',
          '/auth',
          '/api',
        ],
      },
    ],
    sitemap: sitemapUrl,
  }
}

