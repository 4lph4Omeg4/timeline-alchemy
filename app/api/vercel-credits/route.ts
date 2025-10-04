import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const gatewayUrl = process.env.AI_GATEWAY_URL
    const gatewayToken = process.env.AI_GATEWAY_TOKEN
    
    if (!gatewayUrl || !gatewayToken) {
      return NextResponse.json({
        success: false,
        error: 'Vercel AI Gateway not configured'
      }, { status: 400 })
    }

    // Since Vercel API access is restricted, provide basic gateway status
    // The AI Gateway token is primarily for AI requests, not account management
    console.log('🔍 Checking AI Gateway connectivity...')
    
    // Test basic connectivity by making a simple request to the gateway
    try {
      // Try different gateway endpoints to test connectivity
      const endpoints = [
        `${gatewayUrl}/models`,
        `${gatewayUrl}/v1/models`,
        `${gatewayUrl}/chat/completions`
      ]
      
      let testResponse = null
      let workingEndpoint = null
      
      for (const endpoint of endpoints) {
        try {
          testResponse = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${gatewayToken}`,
              'Content-Type': 'application/json'
            }
          })
          if (testResponse.ok) {
            workingEndpoint = endpoint
            break
          }
        } catch (endpointError) {
          console.log(`❌ Endpoint ${endpoint} failed:`, endpointError)
          continue
        }
      }

      if (testResponse && testResponse.ok) {
        console.log(`✅ AI Gateway is accessible via ${workingEndpoint}`)
        
        return NextResponse.json({
          success: true,
          credits: {
            available: 'Active',
            used: 'In Use',
            status: 'Connected'
          },
          account: {
            name: 'AI Gateway User',
            type: 'Gateway Access'
          },
          usage: {
            gateway: 'Connected',
            models: 'Available',
            endpoint: workingEndpoint
          },
          message: 'AI Gateway is operational - credit details require Vercel dashboard access'
        })
      } else {
        console.log('⚠️ All AI Gateway endpoints failed')
        
        return NextResponse.json({
          success: false,
          credits: {
            available: 'Unknown',
            used: 'Unknown',
            status: 'Connection Failed'
          },
          account: {
            name: 'Gateway Error',
            type: 'Connection Issue'
          },
          error: `All gateway endpoints failed. Check your AI_GATEWAY_URL and AI_GATEWAY_TOKEN.`,
          suggestion: 'Verify your Vercel AI Gateway credentials in your environment variables'
        })
      }
    } catch (gatewayError) {
      console.log('❌ AI Gateway test error:', gatewayError)
      
      return NextResponse.json({
        success: false,
        credits: {
          available: 'Unknown',
          used: 'Unknown',
          status: 'Not Accessible'
        },
        account: {
          name: 'Gateway Unavailable',
          type: 'Connection Error'
        },
        error: 'Unable to connect to AI Gateway',
        suggestion: 'Check your AI_GATEWAY_URL and AI_GATEWAY_TOKEN configuration'
      })
    }

  } catch (error) {
    console.error('❌ Gateway status check error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: {
        message: 'Unable to check Gateway status',
        suggestion: 'Verify your environment variables'
      }
    }, { status: 500 })
  }
}

// Alternative endpoint for testing Gateway connectivity
export async function POST(req: NextRequest) {
  try {
    const { testPrompt } = await req.json()
    
    const gatewayUrl = process.env.AI_GATEWAY_URL
    const gatewayToken = process.env.AI_GATEWAY_TOKEN
    
    if (!gatewayUrl || !gatewayToken) {
      return NextResponse.json({
        success: false,
        error: 'Gateway configuration missing'
      }, { status: 400 })
    }

    // Test the gateway with a simple request
    const testResponse = await fetch(`${gatewayUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gatewayToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4',
        messages: [
          {
            role: 'user',
            content: testPrompt || 'Hello, this is a test message. Please respond with "Gateway working!"'
          }
        ],
        max_tokens: 50
      })
    })

    if (!testResponse.ok) {
      const errorText = await testResponse.text()
      throw new Error(`Gateway test failed: ${testResponse.status} ${errorText}`)
    }

    const result = await testResponse.json()
    
    return NextResponse.json({
      success: true,
      message: 'Gateway test successful',
      response: result.choices?.[0]?.message?.content || 'No response content',
      usage: result.usage,
      gateway: {
        url: gatewayUrl,
        connected: true
      }
    })

  } catch (error) {
    console.error('❌ Gateway test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Gateway test failed',
      gateway: {
        connected: false
      }
    }, { status: 500 })
  }
}
