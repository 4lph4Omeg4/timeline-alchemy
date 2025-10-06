import { NextRequest, NextResponse } from 'next/server'
import { getVercelAIStats } from '@/lib/vercel-ai'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 AI Gateway Debug - Starting diagnostics...')

    // Check environment variables
    const gatewayUrl = process.env.AI_GATEWAY_URL
    const gatewayToken = process.env.AI_GATEWAY_TOKEN || process.env.AI_GATEWAY_API_KEY
    const openaiKey = process.env.OPENAI_API_KEY

    console.log('🔍 Environment check:', {
      gatewayUrl: gatewayUrl ? 'Set' : 'Not set',
      gatewayToken: gatewayToken ? 'Set' : 'Not set',
      openaiKey: openaiKey ? 'Set' : 'Not set'
    })

    // Get Vercel AI stats
    const stats = getVercelAIStats()

    // Test Gateway connectivity if configured
    let gatewayTest = null
    if (gatewayUrl && gatewayToken) {
      try {
        console.log('🧪 Testing Gateway connectivity...')
        
        const testResponse = await fetch(`${gatewayUrl.replace(/\/$/, '')}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${gatewayToken}`,
            'X-Vercel-AI-Gateway': 'true'
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'user',
                content: 'Test message - respond with "Gateway working"'
              }
            ],
            max_tokens: 10
          })
        })

        if (testResponse.ok) {
          const testData = await testResponse.json()
          gatewayTest = {
            status: 'success',
            response: testData.choices?.[0]?.message?.content || 'No response',
            statusCode: testResponse.status
          }
          console.log('✅ Gateway test successful')
        } else {
          const errorText = await testResponse.text()
          gatewayTest = {
            status: 'error',
            error: `HTTP ${testResponse.status}: ${testResponse.statusText}`,
            details: errorText,
            statusCode: testResponse.status
          }
          console.log('❌ Gateway test failed:', errorText)
        }
      } catch (error) {
        gatewayTest = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'network_error'
        }
        console.log('❌ Gateway test error:', error)
      }
    }

    // Test direct OpenAI API
    let openaiTest = null
    if (openaiKey) {
      try {
        console.log('🧪 Testing direct OpenAI API...')
        
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaiKey}`
          },
          body: JSON.stringify({
            model: 'gpt-4',
            messages: [
              {
                role: 'user',
                content: 'Test message - respond with "OpenAI working"'
              }
            ],
            max_tokens: 10
          })
        })

        if (openaiResponse.ok) {
          const openaiData = await openaiResponse.json()
          openaiTest = {
            status: 'success',
            response: openaiData.choices?.[0]?.message?.content || 'No response',
            statusCode: openaiResponse.status
          }
          console.log('✅ OpenAI test successful')
        } else {
          const errorText = await openaiResponse.text()
          openaiTest = {
            status: 'error',
            error: `HTTP ${openaiResponse.status}: ${openaiResponse.statusText}`,
            details: errorText,
            statusCode: openaiResponse.status
          }
          console.log('❌ OpenAI test failed:', errorText)
        }
      } catch (error) {
        openaiTest = {
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
          type: 'network_error'
        }
        console.log('❌ OpenAI test error:', error)
      }
    }

    const result = {
      timestamp: new Date().toISOString(),
      environment: {
        gatewayUrl: gatewayUrl ? 'Configured' : 'Not configured',
        gatewayToken: gatewayToken ? 'Configured' : 'Not configured',
        openaiKey: openaiKey ? 'Configured' : 'Not configured'
      },
      vercelStats: stats,
      tests: {
        gateway: gatewayTest,
        openai: openaiTest
      },
      recommendations: [] as Array<{
        type: string;
        message: string;
        priority: string;
      }>
    }

    // Add recommendations based on test results
    if (!gatewayUrl || !gatewayToken) {
      result.recommendations.push({
        type: 'configuration',
        message: 'AI Gateway not configured. Add AI_GATEWAY_URL and AI_GATEWAY_TOKEN to environment variables.',
        priority: 'high'
      })
    }

    if (!openaiKey) {
      result.recommendations.push({
        type: 'configuration',
        message: 'OpenAI API key not configured. Add OPENAI_API_KEY to environment variables.',
        priority: 'critical'
      })
    }

    if (gatewayTest?.status === 'error') {
      result.recommendations.push({
        type: 'gateway',
        message: `Gateway test failed: ${gatewayTest.error}. Check Gateway URL and token.`,
        priority: 'high'
      })
    }

    if (openaiTest?.status === 'error') {
      result.recommendations.push({
        type: 'openai',
        message: `OpenAI test failed: ${openaiTest.error}. Check API key and credits.`,
        priority: 'critical'
      })
    }

    if (gatewayTest?.status === 'success' && openaiTest?.status === 'success') {
      result.recommendations.push({
        type: 'success',
        message: 'Both Gateway and OpenAI are working! You can use enhanced features.',
        priority: 'info'
      })
    }

    console.log('✅ AI Gateway debug completed')
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ AI Gateway debug error:', error)
    return NextResponse.json(
      {
        error: 'Debug failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
