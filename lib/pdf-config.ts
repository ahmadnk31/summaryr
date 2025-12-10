// PDF.js configuration for Vercel deployment
// This ensures PDF.js worker loads correctly in production

import { pdfjs } from 'react-pdf'

// Configure PDF.js worker for both development and production
if (typeof window !== 'undefined') {
  // In the browser
  if (process.env.NODE_ENV === 'production') {
    // Production: Use CDN for reliability
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`
  } else {
    // Development: Use local or CDN
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`
  }
}

export { pdfjs }
