export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
}

export interface Organization {
  id: string
  name: string
  plan: 'basic' | 'pro' | 'enterprise'
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
  platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'youtube' | 'discord' | 'reddit'
  access_token: string
  refresh_token?: string
  expires_at?: string
  account_id?: string
  account_name?: string
  account_username?: string
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  org_id: string
  stripe_customer_id: string
  stripe_subscription_id: string
  plan: 'basic' | 'pro' | 'enterprise'
  status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
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
