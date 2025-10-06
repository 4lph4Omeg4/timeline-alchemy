export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

export type PlanType = 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'

export interface Organization {
  id: string
  name: string
  plan: PlanType
  stripe_customer_id?: string
  created_at: string
  updated_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: 'owner' | 'admin' | 'member' | 'client'
  created_at: string
  user?: User
}

export interface BlogPost {
  id: string
  org_id: string
  title: string
  content: string
  excerpt?: string
  category?: string
  social_posts?: Record<string, string>
  state: 'draft' | 'scheduled' | 'published'
  scheduled_for?: string
  published_at?: string
  created_at: string
  updated_at: string
  client_id?: string
  created_by_admin?: boolean
  average_rating?: number
  rating_count?: number
  organizations?: {
    id: string
    name: string
  }
}

export interface SocialConnection {
  id: string
  org_id: string
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'youtube' | 'discord' | 'reddit' | 'telegram' | 'wordpress'
  access_token?: string
  refresh_token?: string
  expires_at?: string
  account_id?: string
  account_name?: string
  account_username?: string
  site_url?: string
  username?: string
  password?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  org_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan: PlanType
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
  trial_start_date?: string
  trial_end_date?: string
  is_trial?: boolean
  created_at: string
  updated_at: string
}

export interface PlanFeatures {
  id: string
  plan_name: PlanType
  content_packages_limit?: number // NULL means unlimited
  custom_content_limit?: number // NULL means unlimited
  bulk_generation_limit?: number // NULL means unlimited
  custom_integrations: boolean
  white_label: boolean
  priority_support: boolean
  advanced_analytics: boolean
  price_monthly: number // Price in cents
  created_at: string
  updated_at: string
}

export interface OrganizationUsage {
  id: string
  org_id: string
  content_packages_used: number
  custom_content_used: number
  bulk_generation_used: number
  reset_date: string
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  org_id: string
  name: string
  contact_info?: Record<string, any>
  created_at: string
  updated_at: string
  organizations?: {
    name: string
    plan: string
  }
}

export interface Image {
  id: string
  org_id: string
  post_id?: string
  url: string
  created_at: string
}

export interface PlanLimits {
  postsPerMonth: number
  organizations: number
  socialAccounts: number
}

export interface UsageStats {
  postsThisMonth: number
  organizationsCount: number
  socialAccountsCount: number
}

export type BusinessType = 
  | 'camperdealer' 
  | 'tankstation' 
  | 'restaurant' 
  | 'retail' 
  | 'service' 
  | 'hospitality' 
  | 'automotive' 
  | 'general'

export interface BusinessProfile {
  type: BusinessType
  name: string
  industry: string
  targetAudience: string[]
  keyServices: string[]
  brandVoice: string
  location?: string
}

export interface AIGenerateRequest {
  prompt: string
  type: 'blog' | 'social'
  tone?: 'professional' | 'casual' | 'friendly' | 'authoritative'
  length?: 'short' | 'medium' | 'long'
  platform?: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'youtube'
  businessProfile?: BusinessProfile
}

export interface AIGenerateResponse {
  content: string
  title?: string
  excerpt?: string
  hashtags?: string[]
  suggestions?: string[]
}
