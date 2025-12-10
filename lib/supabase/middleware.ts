import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  // Check if Supabase environment variables are configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase environment variables are not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.')
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    },
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Public routes that don't require authentication
  const publicRoutes = [
    "/",
    "/about-us",
    "/contact",
    "/terms-of-use",
    "/privacy-policy",
    "/support",
    "/sitemap.xml",
    "/robots.txt",
  ]
  // API routes and auth routes are always public
  const isPublicRoute = 
    publicRoutes.includes(request.nextUrl.pathname) || 
    request.nextUrl.pathname.startsWith("/auth") ||
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname === "/sitemap.xml" ||
    request.nextUrl.pathname === "/robots.txt"

  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  // Check if user is verified for protected routes (dashboard, documents, etc.)
  // Exclude verify-email-required and verify-email-success pages to avoid redirect loops
  const verificationPages = ["/auth/verify-email-required", "/auth/verify-email-success", "/auth/verify-email"]
  const isVerificationPage = verificationPages.includes(request.nextUrl.pathname)
  
  if (user && !isPublicRoute && !request.nextUrl.pathname.startsWith("/api") && !isVerificationPage) {
    // Check if user exists in email_verifications table and is verified
    const adminSupabase = createAdminClient()
    const { data: verification } = await adminSupabase
      .from("email_verifications")
      .select("verified")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // User must exist in email_verifications table and be verified
    if (!verification || verification.verified !== true) {
      // User is not verified or doesn't exist in table, redirect to verification page
      const url = request.nextUrl.clone()
      url.pathname = "/auth/verify-email-required"
      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}
