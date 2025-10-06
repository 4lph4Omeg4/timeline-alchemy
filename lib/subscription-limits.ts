import { supabaseAdmin } from '@/lib/supabase'
import { PlanType } from '@/types/index'

// Check if organization can perform action based on their plan
export async function checkPlanLimits(orgId: string, action: 'contentPackage' | 'customContent' | 'bulkGeneration'): Promise<{
  allowed: boolean
  reason?: string
  currentUsage?: number
  limit?: number
}> {
  try {
    // Get organization plan
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('plan')
      .eq('id', orgId)
      .single()

    if (orgError || !org) {
      return { allowed: false, reason: 'Organization not found' }
    }

    const plan = org.plan as PlanType

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
        currentUsage = usage?.content_packages_used || 0
        limit = planFeatures.content_packages_limit
        break
      case 'customContent':
        currentUsage = usage?.custom_content_used || 0
        limit = planFeatures.custom_content_limit
        break
      case 'bulkGeneration':
        currentUsage = usage?.bulk_generation_used || 0
        limit = planFeatures.bulk_generation_limit
        break
    }

    // Check if unlimited (NULL limit) or under limit
    const allowed = limit === null || currentUsage < limit

    return {
      allowed,
      reason: allowed ? undefined : `Plan limit reached. Current: ${currentUsage}, Limit: ${limit}`,
      currentUsage,
      limit: limit || -1
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
    })

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

    const plan = org.plan as PlanType

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
        used: usage?.content_packages_used || 0,
        limit: planFeatures.content_packages_limit
      },
      customContent: {
        used: usage?.custom_content_used || 0,
        limit: planFeatures.custom_content_limit
      },
      bulkGeneration: {
        used: usage?.bulk_generation_used || 0,
        limit: planFeatures.bulk_generation_limit
      },
      plan
    }
  } catch (error) {
    console.error('Error getting organization usage:', error)
    throw error
  }
}
