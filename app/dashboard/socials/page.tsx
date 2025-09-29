'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SocialConnection } from '@/types/index'
import { SocialIcon } from '@/components/ui/social-icons'
import toast from 'react-hot-toast'

// PKCE helper functions
function generateCodeVerifier(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return btoa(String.fromCharCode.apply(null, Array.from(array)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(verifier)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

const socialPlatforms = [
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Connect your Twitter account to publish tweets',
    color: 'bg-black',
    brandColor: '#1DA1F2',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect your LinkedIn account to publish posts',
    color: 'bg-blue-600',
    brandColor: '#0077B5',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect your Instagram account to publish posts',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    brandColor: '#E4405F',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect your Facebook account to publish posts',
    color: 'bg-blue-700',
    brandColor: '#1877F2',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Connect your YouTube account to publish videos',
    color: 'bg-red-600',
    brandColor: '#FF0000',
  },
]

export default function SocialConnectionsPage() {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Helper function to check if a platform is connected
  const isPlatformConnected = (platform: string) => {
    return connections.some(conn => conn.platform === platform)
  }

  // Helper function to get connection info for a platform
  const getConnectionInfo = (platform: string) => {
    return connections.find(conn => conn.platform === platform)
  }

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError) {
          console.error('Auth error:', userError)
          toast.error('Authentication error. Please sign in again.')
          router.push('/auth/signin?redirectTo=' + encodeURIComponent('/dashboard/socials'))
          return
        }
        
        if (!user) {
          console.error('No user found')
          toast.error('Please sign in to view social connections')
          router.push('/auth/signin?redirectTo=' + encodeURIComponent('/dashboard/socials'))
          return
        }

        // Get the user's organization - try to find any organization the user belongs to
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (orgError || !orgMember) {
          console.error('Error getting user organization:', orgError)
          toast.error('No organization found. Please create an organization first.')
          setLoading(false)
          return
        }

        // Fetch connections for the user's organization
        const { data, error } = await supabase
          .from('social_connections')
          .select('*')
          .eq('org_id', orgMember.org_id)

        console.log('Social connections query result:', { data, error, orgId: orgMember.org_id })

        if (error) {
          console.error('Error fetching connections:', error)
        } else {
          setConnections(data || [])
        }
      } catch (error) {
        console.error('Unexpected error:', error)
      } finally {
        setLoading(false)
      }
    }

    // Check for OAuth callback results
    const urlParams = new URLSearchParams(window.location.search)
    const success = urlParams.get('success')
    const error = urlParams.get('error')
    const username = urlParams.get('username')
    const details = urlParams.get('details')

    if (success === 'twitter_connected' && username) {
      toast.success(`Successfully connected to Twitter as @${username}!`)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Refresh connections to show updated state
      fetchConnections()
    } else if (success === 'linkedin_connected') {
      toast.success(`Successfully connected to LinkedIn!`)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Refresh connections to show updated state
      fetchConnections()
    } else if (success === 'instagram_connected' && username) {
      toast.success(`Successfully connected to Instagram as @${username}!`)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Refresh connections to show updated state
      fetchConnections()
    } else if (success === 'facebook_connected' && username) {
      toast.success(`Successfully connected to Facebook as ${username}!`)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Refresh connections to show updated state
      fetchConnections()
    } else if (error) {
      let errorMessage = `Connection failed: ${error}`
      if (details) {
        errorMessage += ` (${details})`
      }
      toast.error(errorMessage)
      console.error('OAuth error details:', { error, details })
      console.error('Full URL params:', Object.fromEntries(urlParams.entries()))
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    fetchConnections()
  }, [])

  const handleConnect = async (platform: string) => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please sign in to connect social accounts')
        router.push('/auth/signin?redirectTo=' + encodeURIComponent('/dashboard/socials'))
        return
      }

      if (platform === 'twitter') {
        // Generate state parameter for security and include code verifier
        const stateParam = Math.random().toString(36).substring(2, 15)
        const codeVerifier = generateCodeVerifier()
        const codeChallenge = await generateCodeChallenge(codeVerifier)

        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (!orgMember) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        const stateData = {
          state: stateParam,
          codeVerifier: codeVerifier,
          org_id: orgMember.org_id,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('Twitter OAuth state data:', stateData)
        
        const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
        authUrl.searchParams.set('response_type', 'code')
        console.log('Twitter OAuth setup:', {
          clientId: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID ? 'SET' : 'NOT SET',
          redirectUri: `${window.location.origin}/api/auth/twitter/callback`,
          orgId: orgMember.org_id
        })
        
        authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || '')
        authUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/auth/twitter/callback`)
        authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read')
        authUrl.searchParams.set('state', state)
        authUrl.searchParams.set('code_challenge', codeChallenge)
        authUrl.searchParams.set('code_challenge_method', 'S256')
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to Twitter OAuth
        window.location.href = authUrl.toString()
      } else if (platform === 'linkedin') {

        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (!orgMember) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        // Generate state parameter for security
        const stateParam = Math.random().toString(36).substring(2, 15)
        const stateData = {
          state: stateParam,
          org_id: orgMember.org_id,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('LinkedIn OAuth state data:', stateData)
        
        // LinkedIn OAuth 2.0 URL
        const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '')
        authUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/auth/linkedin/callback`)
        authUrl.searchParams.set('scope', 'openid profile w_member_social')
        authUrl.searchParams.set('state', state)
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to LinkedIn OAuth
        window.location.href = authUrl.toString()
      } else if (platform === 'facebook') {
        const { data: orgMember } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (!orgMember) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        // Generate state parameter for security
        const stateParam = Math.random().toString(36).substring(2, 15)
        const stateData = {
          state: stateParam,
          org_id: orgMember.org_id,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('Facebook OAuth state data:', stateData)
        
        // Facebook OAuth URL (using Facebook Pages API)
        const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
        authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || '')
        authUrl.searchParams.set('redirect_uri', `${window.location.origin}/api/auth/facebook/callback`)
        authUrl.searchParams.set('scope', 'pages_manage_posts,pages_read_engagement')
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('state', state)
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to Facebook OAuth
        window.location.href = authUrl.toString()
      } else {
        // For other platforms, show coming soon message
        toast.success(`${platform} integration coming soon!`)
      }
    } catch (error) {
      console.error('OAuth error:', error)
      toast.error(`Failed to connect to ${platform}`)
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', connectionId)

      if (error) {
        toast.error('Failed to disconnect account')
      } else {
        setConnections(prev => prev.filter(conn => conn.id !== connectionId))
        toast.success('Account disconnected successfully')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const isConnected = (platform: string) => {
    return connections.some(conn => conn.platform === platform)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Social Connections</h1>
        <p className="text-gray-200 mt-2">
          Connect your social media accounts to publish content automatically
        </p>
      </div>

      {/* Connected Accounts */}
      {connections.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Connected Accounts</CardTitle>
            <CardDescription className="text-gray-200">
              Manage your connected social media accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connections.map((connection) => {
                const platform = socialPlatforms.find(p => p.id === connection.platform)
                return (
                  <div key={connection.id} className="flex items-center justify-between p-6 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className={`w-14 h-14 rounded-xl ${platform?.color} flex items-center justify-center text-white shadow-lg`}>
                        <SocialIcon platform={platform?.id || ''} size="lg" className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">{platform?.name}</h3>
                        <p className="text-sm text-gray-300">
                          Connected on {new Date(connection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDisconnect(connection.id)}
                    >
                      Disconnect
                    </Button>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Platforms */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Available Platforms</CardTitle>
          <CardDescription className="text-gray-200">
            Connect your social media accounts to start publishing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="border border-gray-700 rounded-xl p-6 bg-gray-800 hover:bg-gray-750 transition-all duration-200 hover:border-gray-600 hover:shadow-lg">
                <div className="flex items-center space-x-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl ${platform.color} flex items-center justify-center text-white shadow-md`}>
                    <SocialIcon platform={platform.id} size="md" className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">{platform.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-300 mb-6 leading-relaxed">{platform.description}</p>
                <Button
                  className={`w-full transition-all duration-200 ${
                    isConnected(platform.id) 
                      ? 'bg-green-600 hover:bg-green-700 text-white' 
                      : 'bg-yellow-400 hover:bg-yellow-500 text-black font-semibold'
                  }`}
                  variant={isConnected(platform.id) ? "default" : "default"}
                  onClick={() => isConnected(platform.id) 
                    ? handleDisconnect(connections.find(conn => conn.platform === platform.id)?.id || '') 
                    : handleConnect(platform.id)
                  }
                >
                  {isConnected(platform.id) ? '✓ Connected - Click to Disconnect' : 'Connect Account'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-200">
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-0.5">•</span>
              <p>Make sure you have admin access to the social media accounts you want to connect</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-0.5">•</span>
              <p>You can connect multiple accounts of the same platform</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-0.5">•</span>
              <p>Connected accounts will be used for automatic publishing of scheduled content</p>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-yellow-400 mt-0.5">•</span>
              <p>You can disconnect accounts at any time</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
