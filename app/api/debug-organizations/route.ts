import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user is admin
    const isAdmin = user.email === 'sh4m4ni4k@sh4m4ni4k.nl'

    if (isAdmin) {
      // For admin: get all organizations
      const { data: allOrgs, error: allOrgsError } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false })

      // Get admin's organizations
      const { data: adminOrgs, error: adminOrgsError } = await supabase
        .from('org_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)

      // Get all subscriptions
      const { data: subscriptions, error: subsError } = await supabase
        .from('subscriptions')
        .select('*')

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          isAdmin
        },
        allOrganizations: allOrgs,
        adminOrganizations: adminOrgs,
        subscriptions: subscriptions,
        errors: {
          allOrgsError,
          adminOrgsError,
          subsError
        }
      })
    } else {
      // For regular users: get their organizations
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('org_members')
        .select('*, organizations(*)')
        .eq('user_id', user.id)

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          isAdmin
        },
        userOrganizations: userOrgs,
        error: userOrgsError
      })
    }

  } catch (error) {
    console.error('Error in debug organizations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
