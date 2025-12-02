import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Brain, Users, Target, Award } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { FooterSection } from "@/components/footer-section"
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about Summaryr and our mission to transform how students learn and study by making document processing intelligent and accessible.',
  openGraph: {
    title: 'About Us | Summaryr',
    description: 'Learn about Summaryr and our mission to transform how students learn and study by making document processing intelligent and accessible.',
    url: '/about-us',
  },
  alternates: {
    canonical: '/about-us',
  },
}

export default function AboutUsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold mb-4">About Summaryr</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We're on a mission to transform how students learn and study by making document processing intelligent and accessible.
            </p>
          </div>

          <div className="space-y-8 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-primary" />
                  Our Mission
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Summaryr was born from a simple observation: students spend countless hours reading and re-reading documents, 
                  struggling to extract key information and create effective study materials. We believe that AI can help students 
                  learn more efficiently by automatically generating summaries, flashcards, practice questions, and explanations 
                  from their study materials.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  What We Do
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Summaryr is an AI-powered study platform that helps students transform their documents into interactive study materials. 
                  Our platform supports multiple document formats including PDF, DOCX, and EPUB, and provides:
                </p>
                <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                  <li>AI-generated summaries in multiple formats</li>
                  <li>Interactive flashcards for active recall</li>
                  <li>Practice questions with instant feedback</li>
                  <li>Detailed explanations of complex concepts</li>
                  <li>Document-based chat for instant answers</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Who We Serve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Summaryr is designed for students, learners, and educators who want to maximize their study efficiency. 
                  Whether you're preparing for exams, studying for certifications, or teaching a class, Summaryr helps you 
                  transform static documents into dynamic, interactive learning experiences.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  Our Values
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Accessibility</h3>
                    <p className="text-muted-foreground text-sm">
                      We believe quality study tools should be accessible to all students, which is why we offer a free tier 
                      with essential features.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Privacy</h3>
                    <p className="text-muted-foreground text-sm">
                      Your documents and data are yours. We use industry-standard security practices to protect your information.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Innovation</h3>
                    <p className="text-muted-foreground text-sm">
                      We continuously improve our AI models and features to provide the best possible study experience.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center">
            <Link href="/contact">
              <Button size="lg">Get in Touch</Button>
            </Link>
          </div>
        </div>
      </main>
      <FooterSection />
    </div>
  )
}
