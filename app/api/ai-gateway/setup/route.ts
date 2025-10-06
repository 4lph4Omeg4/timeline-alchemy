import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    title: 'AI Gateway Setup Instructions',
    message: 'Follow these steps to configure Vercel AI Gateway',
    steps: [
      {
        step: 1,
        title: 'Access Vercel Dashboard',
        description: 'Go to your Vercel dashboard and navigate to the AI Gateway section',
        url: 'https://vercel.com/dashboard'
      },
      {
        step: 2,
        title: 'Create AI Gateway',
        description: 'If you don\'t have one, create a new AI Gateway in your Vercel project',
        action: 'Click "Create Gateway" in the AI section'
      },
      {
        step: 3,
        title: 'Get Gateway Credentials',
        description: 'Copy your Gateway URL and Token from the dashboard',
        note: 'The URL should look like: https://your-project.vercel.app/api/gateway'
      },
      {
        step: 4,
        title: 'Add Environment Variables',
        description: 'Add these to your .env.local file:',
        env_vars: {
          AI_GATEWAY_URL: 'your_gateway_url_here',
          AI_GATEWAY_TOKEN: 'your_gateway_token_here'
        }
      },
      {
        step: 5,
        title: 'Test Configuration',
        description: 'Test your setup using the debug endpoint',
        test_url: '/api/test/ai-gateway'
      }
    ],
    troubleshooting: {
      common_issues: [
        {
          issue: 'Gateway not found',
          solution: 'Ensure Gateway URL is correct and includes the full path'
        },
        {
          issue: 'Authentication failed',
          solution: 'Check that Gateway token is valid and not expired'
        },
        {
          issue: 'Credits exhausted',
          solution: 'Add more credits to your Vercel account or OpenAI account'
        },
        {
          issue: 'Rate limiting',
          solution: 'Gateway automatically handles rate limiting, but check your usage'
        }
      ]
    },
    alternative_setup: {
      title: 'Alternative: Use Direct OpenAI',
      description: 'If Gateway setup is complex, you can use direct OpenAI API',
      env_vars: {
        OPENAI_API_KEY: 'your_openai_api_key_here'
      },
      note: 'This will use your OpenAI credits directly without Gateway benefits'
    },
    benefits: {
      gateway: [
        'Enhanced performance with caching',
        'Cost optimization',
        'Usage analytics',
        'Rate limiting protection',
        'Automatic failover'
      ],
      direct_openai: [
        'Simple setup',
        'Direct API access',
        'Full OpenAI features',
        'No additional configuration'
      ]
    }
  })
}
