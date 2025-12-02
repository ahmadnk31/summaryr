import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import { StructuredData } from '@/components/structured-data'
import './globals.css'

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'),
  title: {
    default: 'Summaryr - AI-Powered Study Materials & Document Processing',
    template: '%s | Summaryr',
  },
  
  description: 'Transform your documents into interactive study materials with AI. Generate summaries, flashcards, practice questions, and chat with your documents. Perfect for students and educators.',
  keywords: ['study tools', 'AI learning', 'document processing', 'flashcards', 'study materials', 'PDF summarizer', 'educational technology', 'student tools', 'note taking', 'quiz generator'],
  authors: [{ name: 'Summaryr Team' }],
  creator: 'Summaryr',
  publisher: 'Summaryr',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: 'any',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        url: '/logo.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'Summaryr',
    title: 'Summaryr - AI-Powered Study Materials & Document Processing',
    description: 'Transform your documents into interactive study materials with AI. Generate summaries, flashcards, practice questions, and chat with your documents.',
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
    description: 'Transform your documents into interactive study materials with AI. Generate summaries, flashcards, practice questions, and chat with your documents.',
    images: ['/dashboard-preview.png'],
    creator: '@summaryr',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: 'your-google-verification-code',
    yandex: '2171b91e0d6f4de5',
    me: '30CDD1B2004D4FC8D5155CE351FFFC58',
    // yahoo: 'your-yahoo-verification-code',
    
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <meta name="description" content="Transform your documents into interactive study materials with AI. Generate summaries, flashcards, practice questions, and chat with your documents. Perfect for students and educators." />
          <meta name="keywords" content="study tools, AI learning, document processing, flashcards, study materials, PDF summarizer, educational technology, student tools, note taking, quiz generator" />
          <meta name="author" content="Summaryr Team" />
          <meta name="publisher" content="Summaryr" />
          <meta name="msvalidate.01" content="30CDD1B2004D4FC8D5155CE351FFFC58" /> 
          <meta name="yandex-verification" content="2171b91e0d6f4de5" />
          <meta name="format-detection" content="email=false, address=false, telephone=false" />
          <meta name="robots" content="index, follow" />
          <meta name="googlebot" content="index, follow, max-video-preview:-1, max-image-preview:large, max-snippet:-1" />
      </head>
      <body className={`font-sans antialiased`}>
        <StructuredData />
        {children}
        <Toaster position="top-center" />
        <Analytics />
      </body>
    </html>
  )
}
