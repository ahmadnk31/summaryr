"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { FileText, Sparkles, BookOpen, Zap, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <section className="relative w-full pt-24 pb-20 md:pt-32 md:pb-28 text-center overflow-hidden">
      {/* Modern gradient background */}
      <div 
        className="absolute inset-0 -z-10"
        style={{
          background: `
            radial-gradient(circle 800px at 20% 30%, rgba(147, 51, 234, 0.4), transparent 50%),
            radial-gradient(circle 600px at 80% 20%, rgba(236, 72, 153, 0.35), transparent 50%),
            radial-gradient(circle 700px at 50% 80%, rgba(251, 146, 60, 0.3), transparent 50%),
            radial-gradient(circle 500px at 90% 70%, rgba(168, 85, 247, 0.3), transparent 50%),
            radial-gradient(circle 600px at 10% 80%, rgba(59, 130, 246, 0.25), transparent 50%)
          `
        }}
      />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl relative">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary mb-6"
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>AI-Powered Study Platform</span>
        </motion.div>

        <motion.h1 
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.1 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent"
        >
          Turn Any Document Into
          <br />
          <span className="bg-gradient-to-r from-primary via-fuchsia-500 to-orange-400 bg-clip-text text-transparent">
            Interactive Study Material
          </span>
        </motion.h1>

        <motion.p 
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.2 }}
          className="mt-6 max-w-2xl mx-auto text-lg sm:text-xl text-muted-foreground"
        >
          Upload PDFs, DOCX, or EPUBs. Our AI generates summaries, flashcards, and practice questions to help you learn faster and smarter.
        </motion.p>

        <motion.div 
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.3 }}
          className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link href="/auth/sign-up" className="w-full sm:w-auto">
            <Button 
              size="lg" 
              className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300 group"
            >
              Get Started For Free
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#features-section" className="w-full sm:w-auto">
            <Button 
              variant="ghost" 
              size="lg"
              className="w-full sm:w-auto px-8 py-6 text-base font-semibold rounded-full group"
            >
              Explore Features
              <span className="ml-2 transition-transform group-hover:translate-x-1">→</span>
            </Button>
          </Link>
        </motion.div>

        <motion.div 
          initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.6, delay: shouldReduceMotion ? 0 : 0.4 }}
          className="mt-12 text-sm text-muted-foreground"
        >
          No credit card required. Start learning instantly.
        </motion.div>
      </div>
    </section>
  )
}
