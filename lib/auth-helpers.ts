import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for API routes
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function getUserFromRequest(request: NextRequest) {
  try {
    // Get the session from cookies
    const cookieHeader = request.headers.get('cookie')
    
    if (!cookieHeader) {
      return { user: null, error: 'No session found' }
    }

    // Parse cookies to find the session token
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=')
      acc[key] = value
      return acc
    }, {} as Record<string, string>)

    // Look for Supabase session cookie
    const sessionToken = cookies['sb-access-token'] || cookies['sb-refresh-token']
    
    if (!sessionToken) {
      return { user: null, error: 'No session token found' }
    }

    // Get user from session token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(sessionToken)

    if (error || !user) {
      return { user: null, error: error?.message || 'Invalid session' }
    }

    return { user, error: null }
  } catch (error) {
    return { user: null, error: 'Failed to verify user' }
  }
}
