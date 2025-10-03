import { NextRequest } from 'next/server'
import { generateStreamingContent } from '@/lib/vercel-ai'
import { getVercelAIStats } from '@/lib/vercel-ai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, type = 'blog' } = body
    
    // Validate required fields
    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const stats = getVercelAIStats()
    
    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial metadata
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: 'metadata',
                gateway: stats.isUsingGateway,
                provider: stats.isUsingGateway ? 'vercel-ai-gateway' : 'openai-direct',
                timestamp: new Date().toISOString()
              }) + '\n'
            )
          )

          // Generate streaming content
          const contentGenerator = generateStreamingContent(prompt, type as 'blog' | 'social')
          
          for await (const chunk of contentGenerator) {
            // Send content chunk
            controller.enqueue(
              new TextEncoder().encode(
                JSON.stringify({
                  type: 'content',
                  text: chunk,
                  timestamp: new Date().toISOString()
                }) + '\n'
              )
            )
          }

          // Send completion signal
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: 'complete',
                timestamp: new Date().toISOString()
              }) + '\n'
            )
          )

          controller.close()
        } catch (error) {
          console.error('Streaming error:', error)
          controller.enqueue(
            new TextEncoder().encode(
              JSON.stringify({
                type: 'error',
                error: error instanceof Error ? error.message : 'Unknown error'
              }) + '\n'
            )
          )
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson', // Newline Delimited JSON
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no' // Disable nginx buffering for real-time streams
      }
    })
  } catch (error) {
    console.error('❌ Streaming generation error:', error)
    return new Response(
      JSON.stringify({
        error: 'Failed to start streaming generation',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}
