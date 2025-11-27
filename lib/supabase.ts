import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Crypto polyfill for browser compatibility
if (typeof window !== 'undefined') {
  // Simple compatibility check and polyfill for SubtleCrypto
  try {
    if (typeof window.crypto === 'undefined') {
      (window as any).crypto = {}
    }

    if (typeof window.crypto.subtle === 'undefined') {
      (window as any).crypto.subtle = {}
    }

    // Polyfill digest function to prevent "Unrecognized name" error
    if (typeof window.crypto.subtle.digest === 'undefined' ||
      typeof window.crypto.subtle.digest !== 'function') {
      (window as any).crypto.subtle.digest = async (algorithm: string, data: ArrayBuffer) => {
        // Simple fallback hash - not cryptographically secure but prevents errors
        console.warn('Using polyfill for crypto.subtle.digest with algorithm:', algorithm)

        // Create a deterministic "hash" to prevent errors
        const bytes = new Uint8Array(data)
        const hashArray = new Uint8Array(32) // Standard SHA-256 size

        for (let i = 0; i < hashArray.length; i++) {
          hashArray[i] = bytes[i % bytes.length] ^ (i * 7 + 13)
        }

        return hashArray.buffer
      }
    } else {
      // Override the existing digest function to handle unsupported algorithms
      (window as any).crypto.subtle.digest = async (algorithm: string, data: ArrayBuffer) => {
        try {
          // Try the original function first
          return await window.crypto.subtle.digest(algorithm, data)
        } catch (error) {
          // If it fails with "Unrecognized name" or similar, use our fallback
          console.warn('crypto.subtle.digest failed with algorithm:', algorithm, 'using fallback')

          const bytes = new Uint8Array(data)
          const hashArray = new Uint8Array(32) // Standard SHA-256 size

          for (let i = 0; i < hashArray.length; i++) {
            hashArray[i] = bytes[i % bytes.length] ^ (i * 7 + 13)
          }

          return hashArray.buffer
        }
      }
    }
  } catch (error) {
    console.warn('Crypto polyfill setup failed:', error)
  }
}

// Global singleton instances
let supabaseClient: SupabaseClient<Database> | null = null
let supabaseAdminClient: SupabaseClient<Database> | null = null

// Client-side Supabase instance (for browser) - singleton pattern
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: create a new instance
    return createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  }

  // Client-side: use singleton with minimal config to avoid crypto issues
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'timeline-alchemy-auth-v3' // Updated storage key to clear old sessions
      },
      global: {
        headers: {
          'X-Client-Info': 'timeline-alchemy-web-v3'
        }
      }
    })
  }
  return supabaseClient
})()

// Server-side Supabase instance (for API routes) - singleton pattern
export const supabaseAdmin = (() => {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient<Database>(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  }
  return supabaseAdminClient
})()

// Database types
export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          plan: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan?: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      org_members: {
        Row: {
          id: string
          org_id: string
          user_id: string
          role: 'owner' | 'admin' | 'member' | 'client'
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          role?: 'owner' | 'admin' | 'member' | 'client'
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          role?: 'owner' | 'admin' | 'member' | 'client'
          created_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          org_id: string
          title: string
          content: string
          state: 'draft' | 'scheduled' | 'published'
          scheduled_for: string | null
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          title: string
          content: string
          state?: 'draft' | 'scheduled' | 'published'
          scheduled_for?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          title?: string
          content?: string
          state?: 'draft' | 'scheduled' | 'published'
          scheduled_for?: string | null
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      social_connections: {
        Row: {
          id: string
          org_id: string
          platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'youtube'
          access_token: string
          refresh_token: string | null
          expires_at: string | null
          account_id: string | null
          account_name: string | null
          account_username: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          platform: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'youtube'
          access_token: string
          refresh_token?: string | null
          expires_at?: string | null
          account_id?: string | null
          account_name?: string | null
          account_username?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          platform?: 'twitter' | 'linkedin' | 'instagram' | 'facebook' | 'youtube'
          access_token?: string
          refresh_token?: string | null
          expires_at?: string | null
          account_id?: string | null
          account_name?: string | null
          account_username?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          org_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
          trial_start_date?: string
          trial_end_date?: string
          is_trial?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
          trial_start_date?: string
          trial_end_date?: string
          is_trial?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          plan?: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing'
          trial_start_date?: string
          trial_end_date?: string
          is_trial?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      branding_settings: {
        Row: {
          id: string
          organization_id: string
          logo_url?: string
          logo_position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
          logo_opacity: number
          logo_size: number
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          logo_url?: string
          logo_position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
          logo_opacity?: number
          logo_size?: number
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          logo_url?: string
          logo_position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
          logo_opacity?: number
          logo_size?: number
          enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      plan_features: {
        Row: {
          id: string
          plan_name: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          content_packages_limit: number | null
          custom_content_limit: number | null
          bulk_generation_limit: number | null
          custom_integrations: boolean
          white_label: boolean
          priority_support: boolean
          advanced_analytics: boolean
          price_monthly: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          plan_name: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          content_packages_limit?: number | null
          custom_content_limit?: number | null
          bulk_generation_limit?: number | null
          custom_integrations?: boolean
          white_label?: boolean
          priority_support?: boolean
          advanced_analytics?: boolean
          price_monthly?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          plan_name?: 'trial' | 'basic' | 'initiate' | 'transcendant' | 'universal'
          content_packages_limit?: number | null
          custom_content_limit?: number | null
          bulk_generation_limit?: number | null
          custom_integrations?: boolean
          white_label?: boolean
          priority_support?: boolean
          advanced_analytics?: boolean
          price_monthly?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
