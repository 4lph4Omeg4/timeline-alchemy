import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const gatewayUrl = process.env.AI_GATEWAY_URL
    const gatewayToken = process.env.AI_GATEWAY_TOKEN || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN

    console.log('🔍 Debug - Gateway URL:', gatewayUrl)
    console.log('🔍 Debug - Token present:', !!gatewayToken)
    console.log('🔍 Debug - Token length:', gatewayToken?.length || 0)

    if (!gatewayUrl || !gatewayToken) {
      console.log('❌ Missing gateway configuration')

      // Check if we have direct OpenAI access
      if (process.env.OPENAI_API_KEY) {
        return NextResponse.json({
          success: true,
          credits: {
            available: 'Unlimited',
            used: 'Direct Billing',
            status: 'Direct OpenAI'
          },
          account: {
            name: 'OpenAI Direct',
            type: 'Direct API Access'
          },
          usage: {
            gateway: 'Bypassed',
            models: 'gpt-4, gpt-3.5-turbo',
            endpoint: 'api.openai.com'
          },
          message: 'Using direct OpenAI API key. Vercel AI Gateway features are not active.'
        })
      }

      return NextResponse.json({
        success: false,
        error: 'Vercel AI Gateway not configured',
        debug: {
          hasUrl: !!gatewayUrl,
          hasToken: !!gatewayToken,
          url: gatewayUrl
        }
      }, { status: 400 })
    }

    // Since Vercel API access is restricted, provide basic gateway status
    // The AI Gateway token is primarily for AI requests, not account management
    console.log('🔍 Checking AI Gateway connectivity...')

    // Test basic connectivity by making a simple request to the gateway
    try {
      // Try different gateway endpoints to test connectivity
      const endpoints = [
        `${gatewayUrl}/v1/chat/completions`,
        `${gatewayUrl}/chat/completions`,
        `${gatewayUrl}/models`
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

      console.log('🔍 Tested endpoints:', endpoints)
      console.log('🔍 Working endpoint found:', workingEndpoint)

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
    const gatewayToken = process.env.AI_GATEWAY_TOKEN || process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN

    if (!gatewayUrl || !gatewayToken) {
      return NextResponse.json({
        success: false,
        error: 'Gateway configuration missing'
      }, { status: 400 })
    }

    // Test the gateway with different model names (Vercel AI Gateway format)
    const modelsToTry = ['openai/gpt-5', 'openai/gpt-4', 'openai/gpt-3.5-turbo', 'gpt-4', 'gpt-3.5-turbo']

    let testResponse = null
    let workingModel = null

    for (const model of modelsToTry) {
      try {
        testResponse = await fetch(`${gatewayUrl}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${gatewayToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: testPrompt || 'Hello, this is a test message. Please respond with "Gateway working!"'
              }
            ],
            max_tokens: 50
          })
        })

        if (testResponse.ok) {
          workingModel = model
          break
        } else {
          console.log(`❌ Model ${model} failed:`, testResponse.status)
        }
      } catch (modelError) {
        console.log(`❌ Model ${model} error:`, modelError)
        continue
      }
    }

    if (!testResponse || !testResponse.ok) {
      const errorText = testResponse ? await testResponse.text() : 'No response received'
      throw new Error(`Gateway test failed: ${testResponse?.status || 'No response'} ${errorText}`)
    }

    const result = await testResponse.json()

    return NextResponse.json({
      success: true,
      message: 'Gateway test successful',
      response: result.choices?.[0]?.message?.content || 'No response content',
      usage: result.usage,
      gateway: {
        url: gatewayUrl,
        connected: true,
        workingModel: workingModel
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
