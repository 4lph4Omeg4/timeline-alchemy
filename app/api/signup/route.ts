import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // For now, let's use the regular client and handle this differently
    // This is a temporary solution until we have the service role key
    return NextResponse.json({ 
      message: 'Please use the regular signup form for now. Organization creation will be handled after email confirmation.',
      redirectToSignup: true
    })

  } catch (error) {
    console.error('Signup API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
