import { HeroSection } from "@/components/hero-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { Header } from "@/components/header"
import { AnimatedSection } from "@/components/animated-section"
import dynamic from "next/dynamic"
import type { Metadata } from 'next'
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

// Lazy load below-the-fold components
const SocialProof = dynamic(() => import("@/components/social-proof").then(mod => ({ default: mod.SocialProof })), {
  loading: () => <div className="h-32" />,
})
const BentoSection = dynamic(() => import("@/components/bento-section").then(mod => ({ default: mod.BentoSection })), {
  loading: () => <div className="h-96" />,
})
const LargeTestimonial = dynamic(() => import("@/components/large-testimonial").then(mod => ({ default: mod.LargeTestimonial })), {
  loading: () => <div className="h-64" />,
})
const PricingSection = dynamic(() => import("@/components/pricing-section").then(mod => ({ default: mod.PricingSection })), {
  loading: () => <div className="h-96" />,
})
const TestimonialGridSection = dynamic(() => import("@/components/testimonial-grid-section").then(mod => ({ default: mod.TestimonialGridSection })), {
  loading: () => <div className="h-96" />,
})
const FAQSection = dynamic(() => import("@/components/faq-section").then(mod => ({ default: mod.FAQSection })), {
  loading: () => <div className="h-96" />,
})
const CTASection = dynamic(() => import("@/components/cta-section").then(mod => ({ default: mod.CTASection })), {
  loading: () => <div className="h-64" />,
})
const FooterSection = dynamic(() => import("@/components/footer-section").then(mod => ({ default: mod.FooterSection })), {
  loading: () => <div className="h-64" />,
})

// Get base URL for metadata (works at build time)
// Safely construct base URL with proper fallbacks
function getBaseUrlForMetadata(): string {
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
  
  // Fallback for build time
  return 'https://summaryr.com'
}

const baseUrl = getBaseUrlForMetadata()
const ogImageUrl = `${baseUrl}/social-preview.webp`

export const metadata: Metadata = {
  title: 'Home',
  description: 'Transform your documents into interactive study materials with AI. Generate summaries, flashcards, practice questions, and chat with your documents. Perfect for students and educators worldwide.',
  openGraph: {
    title: 'Summaryr - AI-Powered Study Materials & Document Processing',
    description: 'Transform your documents into interactive study materials with AI. Generate summaries, flashcards, practice questions, and chat with your documents.',
    url: `${baseUrl}/`,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'Summaryr - AI-Powered Study Materials',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Summaryr - AI-Powered Study Materials & Document Processing',
    description: 'Transform your documents into interactive study materials with AI.',
    images: [ogImageUrl],
  },
  alternates: {
    canonical: `${baseUrl}/`,
  },
}

export default async function LandingPage() {
  // Check if user is authenticated
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is signed up, redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background relative pb-0">
      <Header />
      <div className="relative z-10">
        <main className="max-w-[1320px] mx-auto relative">
          {/* Hero section - LCP element */}
          <HeroSection />
          {/* Dashboard Preview Wrapper */}
          <div className="relative -mt-32 md:-mt-48 lg:-mt-64 mb-16 md:mb-24 lg:mb-32">
            <AnimatedSection>
              <div className="flex justify-center">
                <div className="relative w-full max-w-5xl px-4">
                  <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-2 shadow-2xl">
                    <DashboardPreview />
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </main>
        <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto px-6" delay={0.1}>
          <SocialProof />
        </AnimatedSection>
        <AnimatedSection id="features-section" className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-32" delay={0.2}>
          <BentoSection />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-32" delay={0.2}>
          <LargeTestimonial />
        </AnimatedSection>
        <AnimatedSection
          id="pricing-section"
          className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-32"
          delay={0.2}
        >
          <PricingSection />
        </AnimatedSection>
        <AnimatedSection
          id="testimonials-section"
          className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-32"
          delay={0.2}
        >
          <TestimonialGridSection />
        </AnimatedSection>
        <AnimatedSection id="faq-section" className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-32" delay={0.2}>
          <FAQSection />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-32" delay={0.2}>
          <CTASection />
        </AnimatedSection>
        <AnimatedSection className="relative z-10 max-w-[1320px] mx-auto px-4 sm:px-6 lg:px-8 mt-20 md:mt-32" delay={0.2}>
          <FooterSection />
        </AnimatedSection>
      </div>
    </div>
  )
}
