import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Vercel AI Gateway Test - Starting...')

    // Check Vercel environment variables
    const isVercelEnvironment = process.env.VERCEL && process.env.VERCEL_ENV
    const projectId = process.env.VERCEL_PROJECT_ID
    const vercelToken = process.env.VERCEL_TOKEN || process.env.VERCEL_API_TOKEN
    const openaiKey = process.env.OPENAI_API_KEY

    console.log('🔍 Vercel Environment Check:', {
      isVercelEnvironment: !!isVercelEnvironment,
      projectId: projectId || 'Not set',
      vercelToken: vercelToken ? 'Set' : 'Not set',
      openaiKey: openaiKey ? 'Set' : 'Not set',
      environment: process.env.VERCEL_ENV || 'Not set'
    })

    // Check if project is linked to AI Gateway
    if (!isVercelEnvironment) {
      return NextResponse.json({
        status: 'not_vercel',
        message: 'Not running on Vercel environment',
        setup_instructions: {
          step1: 'Deploy your project to Vercel',
          step2: 'Link your project to AI Gateway in Vercel dashboard',
          step3: 'Ensure project has AI Gateway enabled',
          note: 'AI Gateway only works when deployed on Vercel'
        }
      })
    }

    if (!projectId) {
      return NextResponse.json({
        status: 'no_project_id',
        message: 'Vercel project ID not found',
        setup_instructions: {
          step1: 'Ensure your project is properly deployed on Vercel',
          step2: 'Check that VERCEL_PROJECT_ID environment variable is set',
          step3: 'Redeploy your project if necessary'
        }
      })
    }

    // Test Vercel AI Gateway connectivity
    try {
      console.log('🧪 Testing Vercel AI Gateway...')
      
      const gatewayUrl = `https://api.vercel.com/v1/ai/gateway/${projectId}/chat/completions`
      
      const testResponse = await fetch(gatewayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${vercelToken}`,
          'X-Vercel-AI-Gateway': 'true',
          'X-Vercel-Project-Id': projectId
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'user',
              content: 'Say "Vercel AI Gateway working" if you can read this'
            }
          ],
          max_tokens: 10
        })
      })

      if (testResponse.ok) {
        const testData = await testResponse.json()
        console.log('✅ Vercel AI Gateway test successful')
        
        return NextResponse.json({
          status: 'success',
          message: 'Vercel AI Gateway is working!',
          gateway_response: testData.choices?.[0]?.message?.content || 'No response',
          status_code: testResponse.status,
          project_id: projectId,
          environment: process.env.VERCEL_ENV,
          benefits: [
            'Automatic token refresh every 12 hours',
            'Uses Vercel credits instead of OpenAI credits',
            'Enhanced performance and caching',
            'Built-in rate limiting and monitoring'
          ],
          next_steps: [
            'Gateway is ready to use',
            'Enhanced features are available',
            'You can now use bulk content generation with Gateway'
          ]
        })
      } else {
        const errorText = await testResponse.text()
        console.log('❌ Vercel AI Gateway test failed:', errorText)
        
        return NextResponse.json({
          status: 'error',
          message: 'Vercel AI Gateway test failed',
          error: `HTTP ${testResponse.status}: ${testResponse.statusText}`,
          details: errorText,
          status_code: testResponse.status,
          troubleshooting: [
            'Check if AI Gateway is enabled for your project',
            'Verify project is linked to AI Gateway in Vercel dashboard',
            'Ensure Vercel token has proper permissions',
            'Check if you have Vercel credits available'
          ]
        })
      }
    } catch (error) {
      console.log('❌ Vercel AI Gateway test error:', error)
      
      return NextResponse.json({
        status: 'error',
        message: 'Vercel AI Gateway connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: [
          'Check network connectivity',
          'Verify project ID is correct',
          'Ensure Vercel token is valid',
          'Check if AI Gateway service is running'
        ]
      })
    }

  } catch (error) {
    console.error('❌ Vercel AI Gateway test error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
