import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Get effective plan (trial or actual plan)
    const { data: effectivePlan, error: planError } = await supabaseAdmin
      .rpc('get_effective_plan', { org_id_param: orgId } as any)

    if (planError) {
      console.error('Error getting effective plan:', planError)
      return NextResponse.json({ error: 'Failed to get plan status' }, { status: 500 })
    }

    // Get subscription details
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .single()

    if (subError && subError.code !== 'PGRST116') {
      console.error('Error fetching subscription:', subError)
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 })
    }

    // Check if trial is expired
    const { data: isExpired, error: expiredError } = await supabaseAdmin
      .rpc('is_trial_expired', { org_id_param: orgId } as any)

    if (expiredError) {
      console.error('Error checking trial expiration:', expiredError)
      return NextResponse.json({ error: 'Failed to check trial expiration' }, { status: 500 })
    }

    const isTrial = effectivePlan === 'trial'
    const trialExpired = isExpired === true

    return NextResponse.json({
      effectivePlan,
      isTrial,
      trialExpired,
      subscription,
      daysRemaining: (subscription as any)?.trial_end_date 
        ? Math.max(0, Math.ceil((new Date((subscription as any).trial_end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
        : 0
    })

  } catch (error) {
    console.error('Error checking trial status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
