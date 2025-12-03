import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { setupNewUser } from '@/lib/onboarding'
import fetch from 'node-fetch'

// Force node-fetch for Supabase in this route to avoid undici issues
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    fetch: fetch as any
  }
})

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, organizationName } = await request.json()

    if (!email || !password || !name || !organizationName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 1: Create the user account with Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email (no confirmation email needed)
      user_metadata: {
        name,
      },
    })

    if (authError || !authData.user) {
      console.error('Auth error:', authError)
      return NextResponse.json({
        error: authError?.message || 'Failed to create user account'
      }, { status: 400 })
    }

    const userId = authData.user.id

    // Step 2: Run setup (Create Org, Client, Stripe Customer, Subscription)
    try {
      const result = await setupNewUser(
        supabaseAdmin,
        userId,
        email,
        name,
        organizationName.trim()
      )

      return NextResponse.json({
        success: true,
        message: 'Account created successfully',
        userId: userId,
        personalOrganizationId: result.orgId,
        stripeCustomerId: result.stripeCustomerId
      })

    } catch (setupError: any) {
      console.error('Setup error:', setupError)

      // Rollback user creation if setup fails
      await supabaseAdmin.auth.admin.deleteUser(userId)

      return NextResponse.json({
        error: 'Failed to setup account: ' + setupError.message
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Critical API error:', error)
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    )
  }
}

