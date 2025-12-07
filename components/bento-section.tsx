"use client"

import DocumentUpload from "./bento/ben1"
import AiSummaries from "./bento/ben2"
import FlashcardGeneration from "./bento/ben3"
import QuestionGeneration from "./bento/ben4"
import DocumentChat from "./bento/ben5"
import ExplanationsAndNotes from "./bento/ben6"
import { motion } from "framer-motion"
import { useReducedMotion } from "framer-motion"

interface BentoCardProps {
  title: string
  description: string
  Component: React.ComponentType
  className?: string
}

const BentoCard = ({ title, description, Component, className }: BentoCardProps) => {
  const shouldReduceMotion = useReducedMotion()
  
  return (
    <motion.div 
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.3 }}
      className={`relative overflow-hidden rounded-2xl border-2 border-border bg-secondary dark:bg-zinc-900 shadow-xl p-6 flex flex-col group ${className}`}
    >
      <div className="flex-grow relative z-10">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="mt-2 text-muted-foreground">{description}</p>
      </div>
      <div className="mt-4 -mx-6 -mb-6 h-60 relative z-10 bg-muted/50">
        <Component />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  )
}

export function BentoSection() {
  const cards = [
    {
      title: "Upload Any Document",
      description: "Supports PDF, DOCX, and EPUB with automatic text extraction.",
      Component: DocumentUpload,
      className: "md:col-span-2",
    },
    {
      title: "AI Document Summarizer",
      description: "Brief, detailed, or bullet-point summaries in seconds.",
      Component: AiSummaries,
      className: "",
    },
    {
      title: "Generate Smart Flashcards",
      description: "Create interactive flashcards for effective studying.",
      Component: FlashcardGeneration,
      className: "",
    },
    {
      title: "Practice with Questions",
      description: "Generate multiple question types to test your understanding.",
      Component: QuestionGeneration,
      className: "md:col-span-2",
    },
    {
      title: "Chat with Your Documents",
      description: "Ask questions and get instant answers from your content.",
      Component: DocumentChat,
      className: "",
    },
    {
      title: "Explanations & Notes",
      description: "Get AI explanations and save your own notes for better learning.",
      Component: ExplanationsAndNotes,
      className: "",
    },
  ]

  return (
    <section className="w-full py-16 md:py-24">
      <div className="text-center mb-12 md:mb-16">
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          A Powerful Suite of Study Tools
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
          Transform your documents into interactive study materials with our AI-powered features.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <BentoCard key={card.title} {...card} />
        ))}
      </div>
    </section>
  )
}
