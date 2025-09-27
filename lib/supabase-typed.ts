import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

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
      clients: {
        Row: {
          id: string
          org_id: string
          name: string
          contact_info: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          contact_info?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          contact_info?: any
          created_at?: string
          updated_at?: string
        }
      }
      user_clients: {
        Row: {
          id: string
          user_id: string
          client_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          client_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          client_id?: string
          created_at?: string
        }
      }
      images: {
        Row: {
          id: string
          org_id: string
          post_id: string
          url: string
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          post_id: string
          url: string
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          post_id?: string
          url?: string
          created_at?: string
        }
      }
    }
  }
}

// Client-side Supabase instance (for browser) - singleton pattern
let supabaseClient: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (!supabaseClient) {
    supabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  }
  return supabaseClient
})()

// Server-side Supabase instance (for API routes) - singleton pattern
let supabaseAdminClient: ReturnType<typeof createClient<Database>> | null = null

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
