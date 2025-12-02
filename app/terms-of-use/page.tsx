import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Header } from "@/components/header"
import { FooterSection } from "@/components/footer-section"
import type { Metadata } from 'next'

// Get base URL for metadata (works at build time)
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

export const metadata: Metadata = {
  title: 'Terms of Use',
  description: 'Read Summaryr\'s Terms of Use to understand the rules and guidelines for using our platform and services.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Terms of Use | Summaryr',
    description: 'Read Summaryr\'s Terms of Use to understand the rules and guidelines for using our platform and services.',
    url: `${baseUrl}/terms-of-use`,
  },
  alternates: {
    canonical: `${baseUrl}/terms-of-use`,
  },
}

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-semibold mb-4">Terms of Use</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>1. Acceptance of Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Summaryr, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Use License</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Permission is granted to temporarily use Summaryr for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained in Summaryr</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. User Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility 
                for all activities that occur under your account or password. You must notify us immediately of any unauthorized use 
                of your account.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>4. User Content</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You retain ownership of any content you upload to Summaryr. By uploading content, you grant us a license to:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Store and process your content to provide our services</li>
                <li>Use AI to generate summaries, flashcards, questions, and explanations from your content</li>
                <li>Display your content back to you through our platform</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                You are responsible for ensuring you have the right to upload any content you provide to our service.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>5. Prohibited Uses</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed mb-4">You may not use Summaryr:</p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>In any way that violates any applicable law or regulation</li>
                <li>To transmit any malicious code or viruses</li>
                <li>To attempt to gain unauthorized access to our systems</li>
                <li>To upload content that infringes on intellectual property rights</li>
                <li>To upload content that is illegal, harmful, or offensive</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>6. Service Availability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                We strive to provide reliable service but do not guarantee that Summaryr will be available at all times. 
                We reserve the right to modify, suspend, or discontinue any part of the service at any time without notice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>7. Limitation of Liability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                In no event shall Summaryr or its suppliers be liable for any damages (including, without limitation, damages for 
                loss of data or profit, or due to business interruption) arising out of the use or inability to use Summaryr, 
                even if Summaryr or a Summaryr authorized representative has been notified orally or in writing of the possibility 
                of such damage.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>8. Changes to Terms</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                Summaryr may revise these terms of use at any time without notice. By using this service you are agreeing to be 
                bound by the then current version of these terms of use.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>9. Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Use, please contact us at{" "}
                <a href="/contact" className="text-primary hover:underline">our contact page</a>.
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
      <FooterSection />
    </div>
  )
}

