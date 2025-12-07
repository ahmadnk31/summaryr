"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const faqData = [
    {
        question: "What is Summaryr and who is it for?",
        answer:
          "Summaryr is an AI document summarizer and study platform designed for students, learners, and educators who want to transform their documents into interactive study materials. It's perfect for students preparing for exams, professionals studying for certifications, and educators creating study resources. Our AI document summarizer makes it easy to understand complex documents quickly.",
      },
      {
        question: "How does the AI document summarizer work?",
        answer:
          "Our AI document summarizer uses advanced natural language processing to analyze your document content and extract key information. Simply upload your PDF, DOCX, or EPUB file, and our intelligent document summarizer will create concise summaries in seconds. You can choose from brief summaries, detailed summaries, or bullet-point formats. The AI document summarizer automatically detects the language and maintains context throughout the summary.",
      },
      {
        question: "What document formats does the AI document summarizer support?",
        answer:
          "Our AI document summarizer supports PDF, DOCX (Microsoft Word), and EPUB formats. Simply upload your document and our AI document summarizer will automatically extract the text and create summaries, flashcards, questions, and explanations. The document summarizer AI works with academic papers, textbooks, research documents, and more.",
      },
      {
        question: "How does the AI generate study materials?",
        answer:
          "Our AI document summarizer analyzes your document content and uses advanced language models to create summaries, flashcards, and practice questions. The AI automatically detects the language of your document and generates materials in the same language. You can choose from different types of questions (multiple choice, true/false, essay, etc.) and flashcards (basic, definition, concept, formula, vocabulary). The document summarizer AI ensures all generated content is contextually accurate.",
      },
      {
        question: "Is this the best AI document summarizer tool?",
        answer:
          "Yes! Summaryr is one of the best AI document summarizer tools available. Our intelligent document summarizer not only creates summaries but also generates flashcards, practice questions, and allows you to chat with your documents. Unlike simple text summarizers, our AI document summarizer understands context and creates study materials that help you learn effectively. It's the perfect AI summarizer for students and professionals.",
      },
      {
        question: "What's included in the free plan?",
        answer:
          "The free plan includes uploading up to 5 documents, access to our AI document summarizer for creating summaries, generating up to 20 flashcards and 20 practice questions, document chat with limited messages, and basic explanations. It's perfect for students getting started with AI document summarization and study tools.",
      },
]

const FAQItem = ({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) => {
  return (
    <div className="border-b border-border/20">
      <button
        className="w-full flex justify-between items-center text-left py-6"
        onClick={onToggle}
      >
        <span className="text-lg font-medium text-foreground">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <ChevronDown className="w-6 h-6 text-muted-foreground" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <p className="pb-6 text-muted-foreground">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="w-full py-16 md:py-24 relative overflow-hidden">
      <div className="absolute inset-0 -z-10 section-gradient" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
            Find answers to common questions about our platform and features.
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
