"use client"

import type React from "react"
import { useState } from "react"
import { ChevronDown } from "lucide-react"

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
  {
    question: "Can I chat with my documents?",
    answer:
      "Yes! Summaryr includes a document chat feature that allows you to ask questions about your uploaded documents. The AI uses the document content to provide accurate, context-aware answers. Chat history is saved so you can continue conversations later. Combined with our AI document summarizer, this makes understanding complex documents easier than ever.",
  },
  {
    question: "Is my document content secure?",
    answer:
      "Absolutely. We use enterprise-grade security measures including encryption, secure data transmission, and compliance with privacy standards. Your documents are stored securely and only accessible to you. We never share your content with third parties. Your documents processed by our AI document summarizer are completely private and secure.",
  },
]

interface FAQItemProps {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}

const FAQItem = ({ question, answer, isOpen, onToggle }: FAQItemProps) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    onToggle()
  }
  return (
    <div
      className={`w-full bg-[rgba(231,236,235,0.08)] shadow-[0px_2px_4px_rgba(0,0,0,0.16)] overflow-hidden rounded-[10px] outline outline-1 outline-border outline-offset-[-1px] transition-all duration-500 ease-out cursor-pointer`}
      onClick={handleClick}
    >
      <div className="w-full px-5 py-[18px] pr-4 flex justify-between items-center gap-5 text-left transition-all duration-300 ease-out">
        <div className="flex-1 text-foreground text-base font-medium leading-6 break-words">{question}</div>
        <div className="flex justify-center items-center">
          <ChevronDown
            className={`w-6 h-6 text-muted-foreground-dark transition-all duration-500 ease-out ${isOpen ? "rotate-180 scale-110" : "rotate-0 scale-100"}`}
          />
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-out ${isOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}
        style={{
          transitionProperty: "max-height, opacity, padding",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div
          className={`px-5 transition-all duration-500 ease-out ${isOpen ? "pb-[18px] pt-2 translate-y-0" : "pb-0 pt-0 -translate-y-2"}`}
        >
          <div className="text-foreground/80 text-sm font-normal leading-6 break-words">{answer}</div>
        </div>
      </div>
    </div>
  )
}

export function FAQSection() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set())
  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index)
    } else {
      newOpenItems.add(index)
    }
    setOpenItems(newOpenItems)
  }
  return (
    <section className="w-full pt-[66px] pb-20 md:pb-40 px-5 relative flex flex-col justify-center items-center">
      <div className="w-[300px] h-[500px] absolute top-[150px] left-1/2 -translate-x-1/2 origin-top-left rotate-[-33.39deg] bg-primary/10 blur-[100px] z-0" />
      <div className="self-stretch pt-8 pb-8 md:pt-14 md:pb-14 flex flex-col justify-center items-center gap-2 relative z-10">
        <div className="flex flex-col justify-start items-center gap-4">
          <h2 className="w-full max-w-[435px] text-center text-foreground text-4xl font-semibold leading-10 break-words">
            Frequently Asked Questions
          </h2>
          <p className="self-stretch text-center text-muted-foreground text-sm font-medium leading-[18.20px] break-words">
            Everything you need to know about Summaryr and how it can transform your learning experience
          </p>
        </div>
      </div>
      <div className="w-full max-w-[600px] pt-0.5 pb-10 flex flex-col justify-start items-start gap-4 relative z-10">
        {faqData.map((faq, index) => (
          <FAQItem key={index} {...faq} isOpen={openItems.has(index)} onToggle={() => toggleItem(index)} />
        ))}
      </div>
    </section>
  )
}
