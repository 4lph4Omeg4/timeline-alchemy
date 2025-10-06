import { supabaseAdmin } from '@/lib/supabase'
import { PlanType } from '@/types/index'

// Check if organization can perform action based on their plan
export async function checkPlanLimits(orgId: string, action: 'contentPackage' | 'customContent' | 'bulkGeneration'): Promise<{
  allowed: boolean
  reason?: string
  currentUsage?: number
  limit?: number
  warning?: string
}> {
  try {
    // Get effective plan (trial or actual plan)
    const { data: effectivePlan, error: planError } = await supabaseAdmin
      .rpc('get_effective_plan', { org_id_param: orgId } as any)

    if (planError) {
      console.error('Error getting effective plan:', planError)
      return { allowed: false, reason: 'Failed to get plan information' }
    }

    const plan = effectivePlan as PlanType

    // Get plan features from database
    const { data: planFeatures, error: featuresError } = await supabaseAdmin
      .from('plan_features')
      .select('*')
      .eq('plan_name', plan)
      .single()

    if (featuresError || !planFeatures) {
      return { allowed: false, reason: 'Plan features not found' }
    }

    // Get current usage
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('organization_usage')
      .select('*')
      .eq('org_id', orgId)
      .single()

    let currentUsage = 0
    let limit: number | null = null

    switch (action) {
      case 'contentPackage':
        currentUsage = (usage as any)?.content_packages_used || 0
        limit = (planFeatures as any).content_packages_limit
        break
      case 'customContent':
        currentUsage = (usage as any)?.custom_content_used || 0
        limit = (planFeatures as any).custom_content_limit
        break
      case 'bulkGeneration':
        currentUsage = (usage as any)?.bulk_generation_used || 0
        limit = (planFeatures as any).bulk_generation_limit
        break
    }

    // Check if unlimited (NULL limit) or under limit
    const allowed = limit === null || currentUsage < limit

    // Check if trial is expired
    const { data: isTrialExpired, error: expiredError } = await supabaseAdmin
      .rpc('is_trial_expired', { org_id_param: orgId } as any)

    if (expiredError) {
      console.error('Error checking trial expiration:', expiredError)
    }

    // If trial is expired, don't allow any actions
    if (isTrialExpired && plan === 'trial') {
      return { 
        allowed: false, 
        reason: 'Trial has expired. Please subscribe to continue using the service.',
        currentUsage,
        limit: limit || -1
      }
    }

    // Add warning if approaching limit
    let warning = undefined
    if (limit !== null && currentUsage >= limit * 0.8) {
      warning = `You're approaching your ${action} limit (${currentUsage}/${limit})`
    }

    return {
      allowed,
      reason: allowed ? undefined : `Plan limit reached for ${action}`,
      currentUsage,
      limit: limit || -1,
      warning
    }

  } catch (error) {
    console.error('Error checking plan limits:', error)
    return { allowed: false, reason: 'Error checking limits' }
  }
}

// Increment usage counter for organization
export async function incrementUsage(orgId: string, action: 'contentPackage' | 'customContent' | 'bulkGeneration'): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.rpc('increment_usage', {
      org_id_param: orgId,
      usage_type: action
    } as any)

    if (error) {
      console.error('Error incrementing usage:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error incrementing usage:', error)
    return false
  }
}

// Get organization usage stats
export async function getOrganizationUsage(orgId: string): Promise<{
  contentPackages: { used: number; limit: number | null }
  customContent: { used: number; limit: number | null }
  bulkGeneration: { used: number; limit: number | null }
  plan: PlanType
}> {
  try {
    // Get organization plan
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('plan')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      throw new Error('Organization not found')
    }

    const plan = (org as { plan: string }).plan as PlanType

    // Get plan features
    const { data: planFeatures, error: featuresError } = await supabaseAdmin
      .from('plan_features')
      .select('*')
      .eq('plan_name', plan)
      .single()

    if (featuresError || !planFeatures) {
      throw new Error('Plan features not found')
    }

    // Get current usage
    const { data: usage, error: usageError } = await supabaseAdmin
      .from('organization_usage')
      .select('*')
      .eq('org_id', orgId)
      .single()

    return {
      contentPackages: {
        used: (usage as any)?.content_packages_used || 0,
        limit: (planFeatures as any).content_packages_limit
      },
      customContent: {
        used: (usage as any)?.custom_content_used || 0,
        limit: (planFeatures as any).custom_content_limit
      },
      bulkGeneration: {
        used: (usage as any)?.bulk_generation_used || 0,
        limit: (planFeatures as any).bulk_generation_limit
      },
      plan
    }
  } catch (error) {
    console.error('Error getting organization usage:', error)
    throw error
  }
}
