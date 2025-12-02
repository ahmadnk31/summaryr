"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { FileText, Sparkles, BookOpen, Zap, ArrowRight, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

export function HeroSection() {
  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-20 pb-32 md:pt-32 md:pb-40">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/5" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        
        {/* Grid Pattern */}
        <div 
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                              linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "50px 50px"
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        <div className="flex flex-col items-center text-center space-y-8 md:space-y-12">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium text-primary"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI-Powered Study Platform</span>
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4 md:space-y-6 max-w-4xl"
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
                Transform Documents into
              </span>
              <br />
              <span className="bg-gradient-to-r from-primary via-primary to-primary/80 bg-clip-text text-transparent">
                Study Materials
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Upload PDFs, DOCX, or EPUB files and instantly generate AI-powered summaries, flashcards, practice questions, and explanations to supercharge your learning.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto"
          >
            <Link href="/auth/sign-up" className="w-full sm:w-auto">
              <Button 
                size="lg" 
                className="w-full sm:w-auto px-8 py-6 text-base md:text-lg font-semibold rounded-full bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 group"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full sm:w-auto px-8 py-6 text-base md:text-lg font-semibold rounded-full border-2 hover:bg-accent transition-all duration-200"
              >
                Sign In
              </Button>
            </Link>
          </motion.div>

          {/* Feature Pills */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap items-center justify-center gap-3 md:gap-4 pt-4"
          >
            {[
              { icon: FileText, text: "PDF, DOCX, EPUB" },
              { icon: Sparkles, text: "AI-Powered" },
              { icon: BookOpen, text: "Study Tools" },
              { icon: Zap, text: "Instant Generation" }
            ].map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border/50 backdrop-blur-sm hover:bg-muted transition-colors"
              >
                <feature.icon className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">{feature.text}</span>
              </div>
            ))}
          </motion.div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 pt-8 max-w-3xl w-full"
          >
            {[
              "Generate summaries in seconds",
              "Create interactive flashcards",
              "Practice with AI questions"
            ].map((benefit, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-4 rounded-lg bg-card/50 border border-border/50 backdrop-blur-sm hover:bg-card transition-colors"
              >
                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">{benefit}</span>
      </div>
            ))}
          </motion.div>
      </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl -z-10 hidden lg:block" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl -z-10 hidden lg:block" />
    </section>
  )
}
