import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Get the current user from Supabase
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      return NextResponse.json({ 
        error: 'Auth error', 
        details: userError.message,
        authenticated: false 
      })
    }
    
    if (!user) {
      return NextResponse.json({ 
        error: 'No user found', 
        authenticated: false 
      })
    }

    // Get user's organization
    const { data: orgMembers, error: orgError } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ 
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      organization: orgMembers,
      orgError: orgError?.message
    })
  } catch (error) {
    return NextResponse.json({ 
      error: 'Unexpected error', 
      details: error instanceof Error ? error.message : 'Unknown error',
      authenticated: false 
    })
  }
}
