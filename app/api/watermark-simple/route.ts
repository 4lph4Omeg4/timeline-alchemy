export const dynamic = 'force-dynamic'
export const maxDuration = 300

// Ultra-simplified watermark route to test what works
export async function POST() {
  try {
    console.log('🎨 Watermark simple - Step 1: Started')
    
    // Step 1: Test if basic response works
    return Response.json({ 
      success: true,
      message: 'Watermark simple route is working!',
      step: 'basic_response',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return Response.json({ 
    success: true,
    message: 'Watermark Simple API - Ready',
    endpoint: '/api/watermark-simple',
    version: '1.0.0'
  })
}

