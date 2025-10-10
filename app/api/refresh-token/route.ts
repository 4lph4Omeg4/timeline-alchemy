import { NextRequest, NextResponse } from 'next/server'
import { TokenManager } from '@/lib/token-manager'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { orgId, platform, accountId } = await request.json()

    if (!orgId || !platform || !accountId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameters: orgId, platform, accountId' 
      }, { status: 400 })
    }

    const result = await TokenManager.refreshToken(orgId, platform, accountId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in refresh-token API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required parameter: orgId' 
      }, { status: 400 })
    }

    const statuses = await TokenManager.checkTokenStatus(orgId)

    return NextResponse.json({ 
      success: true, 
      statuses 
    })
  } catch (error) {
    console.error('Error in refresh-token GET API:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
