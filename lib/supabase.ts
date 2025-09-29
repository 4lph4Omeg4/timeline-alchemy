import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Global singleton instances
let supabaseClient: ReturnType<typeof createClient> | null = null
let supabaseAdminClient: ReturnType<typeof createClient> | null = null

// Client-side Supabase instance (for browser) - singleton pattern
export const supabase = (() => {
  if (typeof window === 'undefined') {
    // Server-side: create a new instance
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  }
  
// Client-side: use singleton with explicit storage key
if (!supabaseClient) {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storageKey: 'timeline-alchemy-auth-v2', // Updated storage key
      storage: {
        getItem: (key: string) => {
          if (typeof window !== 'undefined') {
            return window.localStorage.getItem(key)
          }
          return null
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, value)
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem(key)
          }
        }
      }
    },
    global: {
      headers: {
        'X-Client-Info': 'timeline-alchemy-web-v2' // Updated client info
      }
    }
  })
}
  return supabaseClient
})()

// Server-side Supabase instance (for API routes) - singleton pattern
export const supabaseAdmin = (() => {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
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
          plan: 'basic' | 'pro' | 'enterprise'
          stripe_customer_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          plan?: 'basic' | 'pro' | 'enterprise'
          stripe_customer_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          plan?: 'basic' | 'pro' | 'enterprise'
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
          plan: 'basic' | 'pro' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due' | 'unpaid'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan: 'basic' | 'pro' | 'enterprise'
          status: 'active' | 'canceled' | 'past_due' | 'unpaid'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          plan?: 'basic' | 'pro' | 'enterprise'
          status?: 'active' | 'canceled' | 'past_due' | 'unpaid'
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}
