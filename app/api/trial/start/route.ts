import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orgId } = await request.json()

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Check if organization already has a trial or active subscription
    const { data: existingSub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .single()

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', subError)
      return NextResponse.json({ error: 'Failed to check existing subscription' }, { status: 500 })
    }

    if (existingSub) {
      return NextResponse.json({ 
        error: 'Organization already has an active subscription',
        subscription: existingSub
      }, { status: 400 })
    }

    // Start trial using database function
    const { data: trialResult, error: trialError } = await supabaseAdmin
      .rpc('start_trial_for_user', { org_id_param: orgId } as any)

    if (trialError || !trialResult) {
      console.error('Error starting trial:', trialError)
      return NextResponse.json({ error: 'Failed to start trial' }, { status: 500 })
    }

    // Get the updated subscription
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated subscription:', fetchError)
      return NextResponse.json({ error: 'Trial started but failed to fetch details' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      subscription,
      message: 'Trial started successfully'
    })

  } catch (error) {
    console.error('Error starting trial:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
