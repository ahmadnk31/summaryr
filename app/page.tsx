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
  title: 'AI Document Summarizer - Summaryr | Transform Documents into Study Materials',
  description: 'The best AI document summarizer tool. Summarize PDFs, DOCX, and EPUB files instantly with AI. Generate summaries, flashcards, practice questions, and chat with your documents. Perfect AI summarizer for students and educators.',
  keywords: [
    'AI document summarizer',
    'document summarizer AI',
    'AI PDF summarizer',
    'AI text summarizer',
    'document summary generator',
    'AI summarizer tool',
    'PDF summarizer AI',
    'automatic document summarizer',
    'AI document summary',
    'intelligent document summarizer',
    'AI-powered summarizer',
    'document summarization AI',
    'AI study materials',
    'document processing AI',
    'online document summarizer',
    'free AI summarizer',
    'AI summarizer online',
    'best document summarizer',
    'AI document analyzer',
    'smart document summarizer',
    'AI content summarizer',
    'document summarizer tool',
    'AI paper summarizer',
    'research paper summarizer AI',
    'academic document summarizer',
    'AI book summarizer',
    'PDF summary generator',
    'AI text summary tool',
    'document summarization tool',
    'AI document reader',
    'intelligent text summarizer',
    'AI document extractor',
    'automated document summarizer',
    'AI document analysis',
    'document summarizer software',
    'AI study assistant',
    'document summarizer for students',
    'AI learning tool',
    'study material generator',
    'AI flashcard generator',
    'document to flashcards',
    'AI question generator',
    'document chat AI',
    'chat with documents',
    'AI document Q&A',
    'PDF to summary',
    'DOCX summarizer',
    'EPUB summarizer',
    'AI note generator',
    'document comprehension tool',
    'AI study companion',
    'educational AI tool',
    'student AI assistant',
    'academic AI tool',
    'research summarizer',
    'lecture notes summarizer',
    'textbook summarizer',
    'study guide generator',
    'AI exam prep tool',
  ],
  openGraph: {
    title: 'AI Document Summarizer - Summaryr | Transform Documents with AI',
    description: 'The best AI document summarizer tool. Summarize PDFs, DOCX, and EPUB files instantly. Generate AI-powered summaries, flashcards, practice questions, and chat with your documents.',
    url: `${baseUrl}/`,
    images: [
      {
        url: ogImageUrl,
        width: 1200,
        height: 630,
        alt: 'AI Document Summarizer - Summaryr',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Document Summarizer - Summaryr | Transform Documents with AI',
    description: 'The best AI document summarizer tool. Summarize PDFs, DOCX, and EPUB files instantly with AI.',
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
