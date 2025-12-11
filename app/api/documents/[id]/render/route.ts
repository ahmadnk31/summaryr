import { NextRequest, NextResponse } from 'next/server'
import { generateDocumentHTML } from '@/app/actions/generate-document-html'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: documentId } = await params
    const searchParams = request.nextUrl.searchParams
    const format = searchParams.get('format') || 'html'

    console.log(`📊 Document render request: ${documentId}, format: ${format}`)

    // Generate HTML
    const result = await generateDocumentHTML(documentId)
    
    if (result.error || !result.html) {
      console.error('❌ Failed to generate HTML:', result.error)
      return NextResponse.json({ error: result.error || 'Failed to generate document' }, { status: 400 })
    }
    
    console.log('✅ HTML generated successfully')
    
    // Return HTML - PDF generation is handled client-side via browser print
    return new NextResponse(result.html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'public, max-age=3600'
      }
    })
  } catch (error) {
    console.error('❌ Document render error:', error)
    return NextResponse.json({ 
      error: 'Failed to render document', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
