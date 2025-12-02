import { HeroSection } from "@/components/hero-section"
import { DashboardPreview } from "@/components/dashboard-preview"
import { SocialProof } from "@/components/social-proof"
import { BentoSection } from "@/components/bento-section"
import { LargeTestimonial } from "@/components/large-testimonial"
import { PricingSection } from "@/components/pricing-section"
import { TestimonialGridSection } from "@/components/testimonial-grid-section"
import { FAQSection } from "@/components/faq-section"
import { CTASection } from "@/components/cta-section"
import { FooterSection } from "@/components/footer-section"
import { AnimatedSection } from "@/components/animated-section"
import { Header } from "@/components/header"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home',
  description: 'Transform your documents into interactive study materials with AI. Generate summaries, flashcards, practice questions, and chat with your documents. Perfect for students and educators worldwide.',
  openGraph: {
    title: 'Summaryr - AI-Powered Study Materials & Document Processing',
    description: 'Transform your documents into interactive study materials with AI. Generate summaries, flashcards, practice questions, and chat with your documents.',
    url: '/',
    images: [
      {
        url: '/dashboard-preview.png',
        width: 1200,
        height: 630,
        alt: 'Summaryr Dashboard Preview',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Summaryr - AI-Powered Study Materials & Document Processing',
    description: 'Transform your documents into interactive study materials with AI.',
    images: ['/dashboard-preview.png'],
  },
  alternates: {
    canonical: '/',
  },
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative pb-0">
      <Header />
      <div className="relative z-10">
        <main className="max-w-[1320px] mx-auto relative">
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
