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
  {
    id: 'discord',
    name: 'Discord',
    description: 'Connect your Discord account to publish messages',
    color: 'bg-indigo-600',
    brandColor: '#5865F2',
  },
  {
    id: 'reddit',
    name: 'Reddit',
    description: 'Connect your Reddit account to publish posts',
    color: 'bg-orange-600',
    brandColor: '#FF4500',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    description: 'Connect your Telegram bot to publish messages',
    color: 'bg-blue-500',
    brandColor: '#0088CC',
  },
  {
    id: 'wordpress',
    name: 'WordPress',
    description: 'Connect your WordPress site to publish blog posts',
    color: 'bg-gray-800',
    brandColor: '#21759B',
  },
]

export default function SocialConnectionsPage() {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showWordPressModal, setShowWordPressModal] = useState(false)
  const [wordPressCredentials, setWordPressCredentials] = useState({
    siteUrl: '',
    username: '',
    password: ''
  })
  const router = useRouter()

  // Helper function to get user's personal organization ID
  const getUserOrgId = async (userId: string) => {
    const { data: orgMembers } = await supabase
      .from('org_members')
      .select('org_id, role')
      .eq('user_id', userId)

    if (!orgMembers || orgMembers.length === 0) {
      return null
    }

    // Find the user's personal organization (not Admin Organization)
    let userOrgId = orgMembers.find(member => member.role !== 'client')?.org_id
    if (!userOrgId) {
      userOrgId = orgMembers[0].org_id
    }

    return userOrgId
  }

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

        // Get the user's personal organization ID
        const userOrgId = await getUserOrgId(user.id)

        if (!userOrgId) {
          console.error('No organization found for user')
          toast.error('No organization found. Please create an organization first.')
          setLoading(false)
          return
        }

        // Fetch connections for the user's organization
        const { data, error } = await supabase
          .from('social_connections')
          .select('*')
          .eq('org_id', userOrgId)

        console.log('Social connections query result:', { data, error, orgId: userOrgId })

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
    } else if (success === 'youtube_connected' && username) {
      toast.success(`Successfully connected to YouTube as ${username}!`)
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname)
      // Refresh connections to show updated state
      fetchConnections()
    } else if (error) {
      let errorMessage = `Connection failed: ${error}`
      if (details) {
        errorMessage += ` (${details})`
      }
      
      // Provide more specific error messages
      if (error === 'oauth_not_configured') {
        errorMessage = 'YouTube OAuth is not properly configured. Please contact administrator.'
      } else if (error === 'invalid_request') {
        errorMessage = 'Invalid OAuth request. Please check your YouTube app configuration.'
      } else if (error === 'access_denied') {
        errorMessage = 'Access denied. Please try again and grant the required permissions.'
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

        const userOrgId = await getUserOrgId(user.id)

        if (!userOrgId) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        const stateData = {
          state: stateParam,
          codeVerifier: codeVerifier,
          org_id: userOrgId,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('Twitter OAuth state data:', stateData)
        
        const authUrl = new URL('https://twitter.com/i/oauth2/authorize')
        authUrl.searchParams.set('response_type', 'code')
        console.log('Twitter OAuth setup:', {
          clientId: process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID ? 'SET' : 'NOT SET',
          redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/twitter/callback`,
          orgId: userOrgId
        })
        
        authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_TWITTER_CLIENT_ID || '')
        authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/twitter/callback`)
        authUrl.searchParams.set('scope', 'tweet.read tweet.write users.read')
        authUrl.searchParams.set('state', state)
        authUrl.searchParams.set('code_challenge', codeChallenge)
        authUrl.searchParams.set('code_challenge_method', 'S256')
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to Twitter OAuth
        window.location.href = authUrl.toString()
      } else if (platform === 'linkedin') {

        const userOrgId = await getUserOrgId(user.id)

        if (!userOrgId) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        // Generate state parameter for security
        const stateParam = Math.random().toString(36).substring(2, 15)
        const stateData = {
          state: stateParam,
          org_id: userOrgId,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('LinkedIn OAuth state data:', stateData)
        
        // LinkedIn OAuth 2.0 URL
        const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization')
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID || '')
        authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/linkedin/callback`)
        authUrl.searchParams.set('scope', 'openid profile w_member_social')
        authUrl.searchParams.set('state', state)
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to LinkedIn OAuth
        window.location.href = authUrl.toString()
      } else if (platform === 'facebook') {
        const userOrgId = await getUserOrgId(user.id)

        if (!userOrgId) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        // Generate state parameter for security
        const stateParam = Math.random().toString(36).substring(2, 15)
        const stateData = {
          state: stateParam,
          org_id: userOrgId,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('Facebook OAuth state data:', stateData)
        
        // Facebook OAuth URL (using Facebook Pages API)
        const authUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth')
        authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_INSTAGRAM_CLIENT_ID || '')
        authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/facebook/callback`)
        authUrl.searchParams.set('scope', 'pages_manage_posts,pages_read_engagement')
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('state', state)
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to Facebook OAuth
        window.location.href = authUrl.toString()
      } else if (platform === 'youtube') {
        const userOrgId = await getUserOrgId(user.id)

        if (!userOrgId) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        // Generate state parameter for security
        const stateParam = Math.random().toString(36).substring(2, 15)
        const stateData = {
          state: stateParam,
          org_id: userOrgId,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('YouTube OAuth state data:', stateData)
        
        // Check if YouTube client ID is configured
        const youtubeClientId = process.env.NEXT_PUBLIC_YOUTUBE_CLIENT_ID
        if (!youtubeClientId) {
          toast.error('YouTube Client ID not configured. Please contact administrator.')
          return
        }

        // YouTube OAuth URL
        const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
        authUrl.searchParams.set('client_id', youtubeClientId)
        authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/youtube/callback`)
        authUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly')
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('access_type', 'offline')
        authUrl.searchParams.set('prompt', 'consent')
        authUrl.searchParams.set('state', state)
        
        console.log('YouTube OAuth URL:', authUrl.toString())
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to YouTube OAuth
        window.location.href = authUrl.toString()
      } else if (platform === 'discord') {
        const userOrgId = await getUserOrgId(user.id)

        if (!userOrgId) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        // Generate state parameter for security
        const stateParam = Math.random().toString(36).substring(2, 15)
        const stateData = {
          state: stateParam,
          org_id: userOrgId,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('Discord OAuth state data:', stateData)
        
        // Discord OAuth URL
        const authUrl = new URL('https://discord.com/api/oauth2/authorize')
        authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_DISCORD_CLIENT_ID || '')
        authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/discord/callback`)
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('scope', 'identify guilds')
        authUrl.searchParams.set('state', state)
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to Discord OAuth
        window.location.href = authUrl.toString()
      } else if (platform === 'reddit') {
        const userOrgId = await getUserOrgId(user.id)

        if (!userOrgId) {
          toast.error('No organization found. Please create an organization first.')
          return
        }

        // Generate state parameter for security
        const stateParam = Math.random().toString(36).substring(2, 15)
        const stateData = {
          state: stateParam,
          org_id: userOrgId,
          user_id: user.id
        }
        const state = btoa(JSON.stringify(stateData))
        
        console.log('Reddit OAuth state data:', stateData)
        
        // Reddit OAuth URL
        const authUrl = new URL('https://www.reddit.com/api/v1/authorize')
        authUrl.searchParams.set('client_id', process.env.NEXT_PUBLIC_REDDIT_CLIENT_ID || '')
        authUrl.searchParams.set('response_type', 'code')
        authUrl.searchParams.set('state', state)
        authUrl.searchParams.set('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/api/auth/reddit/callback`)
        authUrl.searchParams.set('duration', 'permanent')
        authUrl.searchParams.set('scope', 'identity submit')
        
        toast.success(`Redirecting to ${platform} OAuth...`)
        
        // Redirect to Reddit OAuth
        window.location.href = authUrl.toString()
      } else if (platform === 'telegram') {
        // Telegram uses bot tokens, not OAuth
        // Redirect to Telegram channels management page
        toast.success('Redirecting to Telegram channels...')
        router.push('/dashboard/telegram-channels')
      } else if (platform === 'wordpress') {
        // WordPress uses manual credentials
        setShowWordPressModal(true)
      } else {
        // For other platforms, show coming soon message
        toast.success(`${platform} integration coming soon!`)
      }
    } catch (error) {
      console.error('OAuth error:', error)
      toast.error(`Failed to connect to ${platform}`)
    }
  }

  const handleWordPressConnect = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        toast.error('Please sign in to connect WordPress')
        return
      }

      const userOrgId = await getUserOrgId(user.id)
      if (!userOrgId) {
        toast.error('No organization found. Please create an organization first.')
        return
      }

      // Validate credentials
      if (!wordPressCredentials.siteUrl || !wordPressCredentials.username || !wordPressCredentials.password) {
        toast.error('Please fill in all WordPress credentials')
        return
      }

      // Test WordPress connection via our API to avoid CORS issues
      const testResponse = await fetch('/api/test-wordpress-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siteUrl: wordPressCredentials.siteUrl,
          username: wordPressCredentials.username,
          password: wordPressCredentials.password
        })
      })

      const testResult = await testResponse.json()
      if (!testResult.success) {
        toast.error(`WordPress connection failed: ${testResult.error}`)
        return
      }

      // Save WordPress connection
      const { error } = await supabase
        .from('social_connections')
        .insert({
          org_id: userOrgId,
          platform: 'wordpress',
          site_url: wordPressCredentials.siteUrl,
          username: wordPressCredentials.username,
          password: wordPressCredentials.password,
          account_id: `wp_${wordPressCredentials.username}`,
          account_name: wordPressCredentials.username
        })

      if (error) {
        console.error('WordPress connection error:', error)
        toast.error('Failed to save WordPress connection')
        return
      }

      toast.success('WordPress connected successfully!')
      setShowWordPressModal(false)
      setWordPressCredentials({ siteUrl: '', username: '', password: '' })
      fetchConnections()
    } catch (error) {
      console.error('WordPress connection error:', error)
      toast.error('Failed to connect WordPress')
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
    if (platform === 'instagram') {
      // Instagram is connected if Facebook is connected (since Instagram posts through Facebook Pages)
      return connections.some(conn => conn.platform === 'facebook')
    }
    if (platform === 'telegram') {
      // Telegram is always connected if user has Telegram channels
      return true // We'll check for channels in the UI
    }
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
                        <div className="text-sm text-gray-300 space-y-1">
                          {connection.account_name && (
                            <p className="text-green-400 font-medium">
                              {connection.account_name}
                              {connection.account_username && connection.account_username !== connection.account_name && (
                                <span className="text-gray-400 ml-2">({connection.account_username})</span>
                              )}
                            </p>
                          )}
                          <p className="text-xs text-gray-400">
                            Connected on {new Date(connection.created_at).toLocaleDateString()}
                          </p>
                        </div>
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
              
              {/* Show Instagram as connected if Facebook is connected */}
              {connections.some(conn => conn.platform === 'facebook') && !connections.some(conn => conn.platform === 'instagram') && (() => {
                const facebookConnection = connections.find(conn => conn.platform === 'facebook')
                return (
                  <div className="flex items-center justify-between p-6 border border-green-500 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg">
                        <SocialIcon platform="instagram" size="lg" className="text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white text-lg">Instagram</h3>
                        <div className="text-sm text-gray-300 space-y-1">
                          <p className="text-green-400 font-medium">
                            Connected via Facebook Pages
                            {facebookConnection?.account_name && (
                              <span className="text-gray-400 ml-2">({facebookConnection.account_name})</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-400">
                            Connected on {facebookConnection ? new Date(facebookConnection.created_at).toLocaleDateString() : 'Unknown'}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-400 text-sm font-medium">✓ Active</span>
                    </div>
                  </div>
                )
              })()}

              {/* Show Telegram as always connected */}
              <div className="flex items-center justify-between p-6 border border-blue-500 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-xl bg-blue-500 flex items-center justify-center text-white shadow-lg">
                    <SocialIcon platform="telegram" size="lg" className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-lg">Telegram</h3>
                    <div className="text-sm text-gray-300 space-y-1">
                      <p className="text-blue-400 font-medium">
                        Bot Channels Management
                      </p>
                      <p className="text-xs text-gray-400">
                        Always available for channel management
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    className="border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white"
                    onClick={() => router.push('/dashboard/telegram-channels')}
                  >
                    Manage Channels
                  </Button>
                  <span className="text-blue-400 text-sm font-medium">✓ Active</span>
                </div>
              </div>
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
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50' 
                      : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50'
                  }`}
                  variant={isConnected(platform.id) ? "default" : "default"}
                  onClick={() => {
                    if (platform.id === 'telegram') {
                      router.push('/dashboard/telegram-channels')
                    } else if (isConnected(platform.id)) {
                      handleDisconnect(connections.find(conn => conn.platform === platform.id)?.id || '')
                    } else {
                      handleConnect(platform.id)
                    }
                  }}
                >
                  {platform.id === 'telegram' 
                    ? '✓ Connected - Manage Channels' 
                    : isConnected(platform.id) 
                      ? '✓ Connected - Click to Disconnect' 
                      : 'Connect Account'
                  }
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* WordPress Connection Modal */}
      {showWordPressModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Connect WordPress Site</CardTitle>
              <CardDescription className="text-gray-200">
                Enter your WordPress site credentials to enable automatic blog posting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Site URL</label>
                  <input
                    type="url"
                    placeholder="https://yoursite.com"
                    value={wordPressCredentials.siteUrl}
                    onChange={(e) => setWordPressCredentials(prev => ({ ...prev, siteUrl: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Username</label>
                  <input
                    type="text"
                    placeholder="your_username"
                    value={wordPressCredentials.username}
                    onChange={(e) => setWordPressCredentials(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-white text-sm font-medium mb-2 block">Password</label>
                  <input
                    type="password"
                    placeholder="your_password_or_app_password"
                    value={wordPressCredentials.password}
                    onChange={(e) => setWordPressCredentials(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>
                <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-3">
                  <div className="text-blue-200 text-sm">
                    <strong>💡 Tip:</strong> For better security, use an Application Password instead of your regular password. 
                    Go to WordPress Admin → Users → Your Profile → Application Passwords.
                  </div>
                </div>
                <div className="flex space-x-3">
                  <Button
                    onClick={handleWordPressConnect}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold"
                  >
                    Connect WordPress
                  </Button>
                  <Button
                    onClick={() => setShowWordPressModal(false)}
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
