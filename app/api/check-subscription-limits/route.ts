import { NextRequest, NextResponse } from 'next/server'
import { checkPlanLimits } from '@/lib/subscription-limits'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orgId, action, count = 1 } = await request.json()

    if (!orgId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: orgId and action' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user has access to this organization
    const { data: orgMember } = await supabase
      .from('org_members')
      .select('role')
      .eq('org_id', orgId)
      .eq('user_id', user.id)
      .single()

    if (!orgMember) {
      return NextResponse.json(
        { error: 'Access denied to organization' },
        { status: 403 }
      )
    }

    // Check plan limits
    const limitCheck = await checkPlanLimits(orgId, action as 'contentPackage' | 'customContent' | 'bulkGeneration')

    // If checking bulk generation, multiply by count
    if (action === 'bulkGeneration' && count > 1) {
      const totalUsage = (limitCheck.currentUsage || 0) + count
      const limit = limitCheck.limit || -1
      
      if (limit !== -1 && totalUsage > limit) {
        return NextResponse.json({
          allowed: false,
          reason: `Bulk generation would exceed plan limit. Current: ${limitCheck.currentUsage}, Requested: ${count}, Limit: ${limit}`,
          currentUsage: limitCheck.currentUsage,
          limit: limit,
          requestedCount: count
        })
      }
    }

    return NextResponse.json({
      allowed: limitCheck.allowed,
      reason: limitCheck.reason,
      currentUsage: limitCheck.currentUsage,
      limit: limitCheck.limit,
      warning: limitCheck.allowed && limitCheck.limit !== -1 && 
               (limitCheck.currentUsage || 0) + count > (limitCheck.limit || 0) * 0.8 
               ? `Approaching plan limit: ${limitCheck.currentUsage}/${limitCheck.limit}`
               : undefined
    })

  } catch (error) {
    console.error('Error checking subscription limits:', error)
    return NextResponse.json(
      { error: 'Failed to check subscription limits' },
      { status: 500 }
    )
  }
}
