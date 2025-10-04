import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const vercelToken = process.env.AI_GATEWAY_TOKEN
    
    if (!vercelToken) {
      return NextResponse.json({
        success: false,
        error: 'Vercel AI Gateway token not configured'
      }, { status: 400 })
    }

    // Get Vercel account information and credits
    const response = await fetch('https://api.vercel.com/v2/user', {
      headers: {
        'Authorization': `Bearer ${vercelToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      // If direct user API fails, try alternative approach
      console.log('Direct user API failed, trying alternative approach')
      
      // Alternative: Use Vercel's team/project API
      const projectResponse = await fetch('https://api.vercel.com/v9/projects', {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!projectResponse.ok) {
        throw new Error(`Vercel API error: ${projectResponse.status} ${projectResponse.statusText}`)
      }

      const projectData = await projectResponse.json()
      
      return NextResponse.json({
        success: true,
        credits: {
          available: 'Unknown',
          used: 'Unknown',
          status: 'Connected',
          source: 'project_api'
        },
        account: {
          name: 'Connected',
          type: 'Project Access'
        },
        usage: {
          projects: projectData.projects?.length || 0
        }
      })
    }

    const userData = await response.json()
    
    // Try to get usage/billing information
    let creditInfo = {
      available: 'Unknown',
      used: 'Unknown', 
      status: 'Connected'
    }

    try {
      // Attempt to get billing/usage info
      const billingResponse = await fetch('https://api.vercel.com/v1/billing', {
        headers: {
          'Authorization': `Bearer ${vercelToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (billingResponse.ok) {
        const billingData = await billingResponse.json()
        creditInfo = {
          available: billingData.credit || 'Unknown',
          used: billingData.usage || 'Unknown',
          status: 'Active'
        }
      }
    } catch (billingError) {
      console.log('Billing API not accessible, using basic info')
    }

    return NextResponse.json({
      success: true,
      credits: creditInfo,
      account: {
        name: userData.name || userData.username || 'Vercel User',
        email: userData.email,
        type: userData.type || 'Personal'
      },
      usage: {
        projects: userData.projects || 0
      }
    })

  } catch (error) {
    console.error('❌ Vercel credits fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      fallback: {
        message: 'Unable to fetch credit information',
        suggestion: 'Check your Vercel AI Gateway token configuration'
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
