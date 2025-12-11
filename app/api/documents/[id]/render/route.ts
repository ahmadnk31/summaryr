import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentHTML } from '@/app/actions/generate-document-html'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'

const isDevelopment = process.env.NODE_ENV === 'development'

async function generatePDF(html: string): Promise<Buffer> {
  let browser
  
  try {
    // Configure puppeteer for development vs production
    let browserConfig
    
    if (isDevelopment) {
      // Development: use local Chrome/Chromium
      const chromePath = process.platform === 'darwin' 
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : process.platform === 'linux'
        ? '/usr/bin/google-chrome'
        : 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
      
      browserConfig = {
        executablePath: chromePath,
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      }
      console.log('🔄 Development mode: Using local Chrome at', chromePath)
    } else {
      // Production: use Chromium from @sparticuz/chromium
      // Set the path to /tmp for Vercel serverless functions
      await chromium.font(
        'https://raw.githack.com/googlei18n/noto-emoji/master/fonts/NotoColorEmoji.ttf'
      )
      
      browserConfig = {
        args: [
          ...chromium.args,
          '--disable-dev-shm-usage',
          '--disable-setuid-sandbox',
          '--no-sandbox',
        ],
        executablePath: await chromium.executablePath('/tmp/chromium'),
        headless: true,
      }
      console.log('🔄 Production mode: Using @sparticuz/chromium')
    }

    console.log('🔄 Launching browser...')
    browser = await puppeteer.launch(browserConfig)

    const page = await browser.newPage()
    
    console.log('📄 Setting HTML content...')
    // Set content and wait for any async operations
    await page.setContent(html, { 
      waitUntil: 'networkidle0',
      timeout: 30000
    })

    console.log('🎨 Generating PDF...')
    // Generate PDF with optimal settings for documents
    const pdfBuffer = await page.pdf({
      format: 'A4',
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      },
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: '<div style="font-size: 10px; width: 100%; text-align: center; color: #666;"><span class="date"></span></div>',
      footerTemplate: '<div style="font-size: 10px; width: 100%; text-align: center; color: #666;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>',
      preferCSSPageSize: false
    })

    console.log('✅ PDF generated successfully')
    return Buffer.from(pdfBuffer)
  } catch (error) {
    console.error('❌ PDF generation failed:', error)
    throw error
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'html'

    console.log(`📊 Document render request: ${documentId}, format: ${format}`)

    // Generate HTML first (needed for both formats)
    const result = await generateDocumentHTML(documentId)
    
    if (result.error || !result.html) {
      console.error('❌ Failed to generate HTML:', result.error)
      return NextResponse.json({ error: result.error || 'Failed to generate document' }, { status: 400 })
    }
    
    console.log('✅ HTML generated successfully')
    
    if (format === 'html') {
      return new NextResponse(result.html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

    if (format === 'pdf') {
      console.log('🔄 Starting PDF generation...')
      const pdfBuffer = await generatePDF(result.html)
      
      console.log('✅ PDF generated, returning response')
      return new Response(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="document-${documentId}.pdf"`,
          'Cache-Control': 'public, max-age=3600'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('❌ Document render error:', error)
    return NextResponse.json({ 
      error: 'Failed to render document', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
