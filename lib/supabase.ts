import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Client-side Supabase instance (for browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase instance (for API routes)
export const supabaseAdmin = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

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
