'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SocialIcon } from '@/components/ui/social-icons'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'react-hot-toast'
import { SocialConnection } from '@/types/index'

// Helper function to generate PKCE code verifier
function generateCodeVerifier(): string {
  try {
    // Check if crypto.getRandomValues is available
    if (crypto && typeof crypto.getRandomValues === 'function') {
      const array = new Uint8Array(32)
      crypto.getRandomValues(array)
      return btoa(String.fromCharCode.apply(null, Array.from(array)))
    } else {
      // Fallback if crypto.getRandomValues is not available
      console.warn('crypto.getRandomValues not available, using Math.random fallback')
      let result = ''
      for (let i = 0; i < 32; i++) {
        result += String.fromCharCode(Math.floor(Math.random() * 256))
      }
      return btoa(result)
    }
  } catch (error) {
    console.error('Error generating code verifier:', error)
    // Ultimate fallback
    let result = ''
    for (let i = 0; i < 32; i++) {
      result += String.fromCharCode(Math.floor(Math.random() * 256))
    }
    return btoa(result)
  }
}

// Helper function to generate PKCE code challenge
async function generateCodeChallenge(verifier: string): Promise<string> {
  try {
    const encoder = new TextEncoder()
    const data = encoder.encode(verifier)

    // Check if crypto.subtle is available and supports SHA256
    if (crypto.subtle && typeof crypto.subtle.digest === 'function') {
      try {
        const digest = await crypto.subtle.digest('SHA-256', data)
        return btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(digest))))
      } catch (cryptoError) {
        console.warn('Crypto.subtle.digest failed, using fallback:', cryptoError)
        // Fallback to a simple hash if crypto.subtle fails
        return btoa(verifier)
      }
    } else {
      console.warn('Crypto.subtle not available, using fallback')
      // Fallback if crypto.subtle is not available
      return btoa(verifier)
    }
  } catch (error) {
    console.error('Error generating code challenge:', error)
    // Ultimate fallback
    return btoa(verifier)
  }
}

const socialPlatforms = [
  {
    id: 'twitter',
    name: 'Twitter',
    description: 'Connect your Twitter account to publish tweets automatically',
    color: 'bg-black',
    brandColor: '#000000',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect your LinkedIn account to publish professional posts',
    color: 'bg-blue-700',
    brandColor: '#0077B5',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect your Facebook account to publish posts and manage pages',
    color: 'bg-blue-600',
    brandColor: '#1877F2',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect your Instagram account via Facebook Pages',
    color: 'bg-gradient-to-br from-purple-500 to-pink-500',
    brandColor: '#E4405F',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Connect your YouTube channel to publish videos',
    color: 'bg-red-600',
    brandColor: '#FF0000',
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Connect your Discord server to publish messages',
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
    description: 'Manage your Telegram bot channels',
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
  const supabase = createClient()
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [showWordPressModal, setShowWordPressModal] = useState(false)
  const [wordPressCredentials, setWordPressCredentials] = useState({
    siteUrl: '',
    username: '',
    password: ''
  })
  const [showWordPressDebug, setShowWordPressDebug] = useState(false)
  const [wordPressDebugResults, setWordPressDebugResults] = useState<any>(null)
  const [wordPressTesting, setWordPressTesting] = useState(false)
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
    let userOrgId = (orgMembers as any[]).find(member => member.role !== 'client')?.org_id
    if (!userOrgId) {
      userOrgId = (orgMembers as any[])[0].org_id
    }
    return userOrgId
  }

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

      // Get user's personal organization ID
      const userOrgId = await getUserOrgId(user.id)
      if (!userOrgId) {
        console.error('No organization found for user')
        toast.error('No organization found. Please contact administrator.')
        return
      }

      // Fetch social connections for the user's personal organization
      const { data: socialConnections, error: connectionsError } = await supabase
        .from('social_connections')
        .select('*')
        .eq('org_id', userOrgId)
        .order('created_at', { ascending: false })

      if (connectionsError) {
        console.error('Error fetching connections:', connectionsError)
        toast.error('Failed to load social connections')
        return
      }

      setConnections(socialConnections || [])
    } catch (error) {
      console.error('Unexpected error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
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

      // Get user's personal organization ID
      const userOrgId = await getUserOrgId(user.id)
      if (!userOrgId) {
        toast.error('No organization found. Please contact administrator.')
        return
      }

      // Generate PKCE parameters
      const codeVerifier = generateCodeVerifier()
      const codeChallenge = await generateCodeChallenge(codeVerifier)

      // Store code verifier in session storage
      sessionStorage.setItem('code_verifier', codeVerifier)

      // Create state parameter with user and org info
      const state = btoa(JSON.stringify({
        user_id: user.id,
        org_id: userOrgId
      }))

      let authUrl = ''

      if (platform === 'twitter') {
        authUrl = `/api/auth/twitter?state=${encodeURIComponent(state)}`
      } else if (platform === 'linkedin') {
        authUrl = `/api/auth/linkedin?state=${encodeURIComponent(state)}`
      } else if (platform === 'facebook') {
        authUrl = `/api/auth/facebook?state=${encodeURIComponent(state)}`
      } else if (platform === 'instagram') {
        // Instagram uses Facebook OAuth
        authUrl = `/api/auth/facebook?state=${encodeURIComponent(state)}`
      } else if (platform === 'youtube') {
        authUrl = `/api/auth/youtube?state=${encodeURIComponent(state)}`
      } else if (platform === 'discord') {
        authUrl = `/api/auth/discord?state=${encodeURIComponent(state)}`
      } else if (platform === 'reddit') {
        authUrl = `/api/auth/reddit?state=${encodeURIComponent(state)}`
      } else if (platform === 'telegram') {
        // Telegram uses manual channel management
        router.push('/dashboard/telegram-channels')
        return
      } else if (platform === 'wordpress') {
        // WordPress uses manual credentials
        setShowWordPressModal(true)
        return
      }

      if (authUrl) {
        window.location.href = authUrl
      }
    } catch (error) {
      console.error('Connection error:', error)
      toast.error('Failed to initiate connection')
    }
  }

  const handleDisconnect = async (connectionId: string) => {
    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', connectionId)

      if (error) {
        console.error('Disconnect error:', error)
        toast.error('Failed to disconnect account')
      } else {
        setConnections(prev => prev.filter(conn => conn.id !== connectionId))
        toast.success('Account disconnected successfully')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleWordPressDebug = async () => {
    if (!wordPressCredentials.siteUrl || !wordPressCredentials.username || !wordPressCredentials.password) {
      toast.error('Please fill in all WordPress credentials first')
      return
    }

    setWordPressTesting(true)
    try {
      const debugResponse = await fetch('/api/debug-wordpress', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          siteUrl: wordPressCredentials.siteUrl,
          username: wordPressCredentials.username,
          password: wordPressCredentials.password,
          testAction: 'test_post'
        })
      })

      const debugResult = await debugResponse.json()
      setWordPressDebugResults(debugResult)
      setShowWordPressDebug(true)

      if (debugResult.success) {
        toast.success('WordPress diagnostics completed! Check the debug panel.')
      } else {
        toast.error(`Debug failed: ${debugResult.error}`)
      }
    } catch (error) {
      console.error('WordPress debug error:', error)
      toast.error('WordPress debug failed')
    } finally {
      setWordPressTesting(false)
    }
  }

  const handleWordPressConnect = async () => {
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error('Please sign in to connect WordPress')
        router.push('/auth/signin?redirectTo=' + encodeURIComponent('/dashboard/socials'))
        return
      }

      // Get user's personal organization ID
      const userOrgId = await getUserOrgId(user.id)
      if (!userOrgId) {
        toast.error('No organization found. Please contact administrator.')
        return
      }

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

  // Helper function to get connection info for a platform
  const getConnectionInfo = (platform: string) => {
    return connections.find(conn => conn.platform === platform)
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
                  className={`w-full transition-all duration-200 ${isConnected(platform.id)
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
                    onClick={handleWordPressDebug}
                    disabled={wordPressTesting}
                    variant="outline"
                    className="border-blue-600 text-blue-400 hover:bg-blue-900/30"
                  >
                    {wordPressTesting ? 'Testing...' : 'Debug'}
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

      {/* WordPress Debug Modal */}
      {showWordPressDebug && wordPressDebugResults && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="bg-gray-900 border-gray-800 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-white">WordPress Integration Diagnostics</CardTitle>
              <CardDescription className="text-gray-200">
                Detailed analysis of your WordPress connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              {wordPressDebugResults.success ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Summary</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-300">Site Accessible:</span>
                        <span className={wordPressDebugResults.summary?.siteAccessible ? "text-green-400" : "text-red-400"}>
                          {wordPressDebugResults.summary?.siteAccessible ? "✅ Yes" : "❌ No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Authentication:</span>
                        <span className={wordPressDebugResults.summary?.hasAuthentication ? "text-green-400" : "text-red-400"}>
                          {wordPressDebugResults.summary?.hasAuthentication ? "✅ Yes" : "❌ No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">Can Post:</span>
                        <span className={wordPressDebugResults.summary?.canPost ? "text-green-400" : "text-red-400"}>
                          {wordPressDebugResults.summary?.canPost ? "✅ Yes" : "❌ No"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-300">WordPress.com:</span>
                        <span className={wordPressDebugResults.summary?.isWordPressCom ? "text-blue-400" : "text-gray-300"}>
                          {wordPressDebugResults.summary?.isWordPressCom ? "✅ Yes" : "❌ No"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* API Endpoints */}
                  <div>
                    <h3 className="text-white font-semibold mb-3">API Endpoints Test</h3>
                    <div className="space-y-2">
                      {Object.entries(wordPressDebugResults.debugResults.apiEndpoints || {}).map(([endpoint, result]: [string, any]) => (
                        <div key={endpoint} className="bg-gray-800 rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-start">
                            <span className="text-gray-300 font-mono">{endpoint}</span>
                            <span className={result?.ok ? "text-green-400" : "text-red-400"}>
                              {result?.ok ? `✅ ${result.status}` : `❌ ${result.error || 'Failed'}`}
                            </span>
                          </div>
                          {result?.url && (
                            <div className="text-gray-400 mt-1">
                              <small>{result.url}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tests */}
                  <div>
                    <h3 className="text-white font-semibold mb-3">Connection Tests</h3>
                    <div className="space-y-2">
                      {Object.entries(wordPressDebugResults.debugResults.tests || {}).map(([testName, result]: [string, any]) => (
                        <div key={testName} className="bg-gray-800 rounded-lg p-3 text-sm">
                          <div className="flex justify-between items-start mb-2">
                            <span className="text-gray-300 capitalize">{testName.replace(/([A-Z])/g, ' $1').trim()}</span>
                            <span className={result?.success !== false ? "text-green-400" : "text-red-400"}>
                              {result?.success !== false ? "✅ Success" : "❌ Failed"}
                            </span>
                          </div>
                          {result?.error && (
                            <div className="text-red-300 mt-1">
                              <small>Error: {result.error}</small>
                            </div>
                          )}
                          {result?.message && (
                            <div className="text-green-300 mt-1">
                              <small>{result.message}</small>
                            </div>
                          )}
                          {result?.user && (
                            <div className="text-blue-300 mt-1">
                              <small>User: {result.user.name} (ID: {result.user.id})</small>
                            </div>
                          )}
                          {result?.postId && (
                            <div className="text-green-300 mt-1">
                              <small>Test post created: ID {result.postId}</small>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                    <h4 className="text-blue-200 font-semibold mb-2">Recommendations</h4>
                    <ul className="text-blue-200 text-sm space-y-1">
                      {!wordPressDebugResults.summary?.siteAccessible && (
                        <li>• Check if your WordPress site URL is correct and accessible</li>
                      )}
                      {!wordPressDebugResults.summary?.hasAuthentication && (
                        <li>• Verify your username and password are correct</li>
                      )}
                      {wordPressDebugResults.summary?.isWordPressCom && !wordPressDebugResults.summary?.canPost && (
                        <li>• WordPress.com has limited REST API access for posting. Consider using a self-hosted WordPress.</li>
                      )}
                      {!wordPressDebugResults.summary?.canPost && !wordPressDebugResults.summary?.isWordPressCom && (
                        <li>• Make sure your WordPress REST API is enabled and you have posting permissions</li>
                      )}
                      {wordPressDebugResults.summary?.canPost && (
                        <li>• ✅ Your WordPress site is ready for integration!</li>
                      )}
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
                  <h3 className="text-red-200 font-semibold mb-2">Debug Failed</h3>
                  <p className="text-red-300 text-sm">{wordPressDebugResults.error}</p>
                </div>
              )}

              <div className="flex justify-end mt-6">
                <Button
                  onClick={() => setShowWordPressDebug(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white"
                >
                  Close
                </Button>
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