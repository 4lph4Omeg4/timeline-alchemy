'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SocialConnection } from '@/types'
import toast from 'react-hot-toast'

const socialPlatforms = [
  {
    id: 'twitter',
    name: 'Twitter/X',
    description: 'Connect your Twitter account to publish tweets',
    icon: '🐦',
    color: 'bg-blue-500',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Connect your LinkedIn account to publish posts',
    icon: '💼',
    color: 'bg-blue-600',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Connect your Instagram account to publish posts',
    icon: '📸',
    color: 'bg-pink-500',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Connect your Facebook account to publish posts',
    icon: '👥',
    color: 'bg-blue-700',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    description: 'Connect your YouTube account to publish videos',
    icon: '📺',
    color: 'bg-red-500',
  },
]

export default function SocialConnectionsPage() {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConnections = async () => {
      try {
        const { data, error } = await supabase
          .from('social_connections')
          .select('*')

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

    fetchConnections()
  }, [])

  const handleConnect = async (platform: string) => {
    try {
      // In a real implementation, this would redirect to the OAuth flow
      // For now, we'll simulate the connection
      toast.success(`Redirecting to ${platform} OAuth...`)
      
      // Simulate OAuth flow
      setTimeout(() => {
        const mockConnection = {
          id: Math.random().toString(36).substr(2, 9),
          org_id: 'mock-org-id',
          platform: platform as any,
          access_token: 'mock-access-token',
          refresh_token: 'mock-refresh-token',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        
        setConnections(prev => [...prev, mockConnection])
        toast.success(`Successfully connected to ${platform}!`)
      }, 2000)
    } catch (error) {
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
        <h1 className="text-3xl font-bold text-gray-900">Social Connections</h1>
        <p className="text-gray-600 mt-2">
          Connect your social media accounts to publish content automatically
        </p>
      </div>

      {/* Connected Accounts */}
      {connections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Accounts</CardTitle>
            <CardDescription>
              Manage your connected social media accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connections.map((connection) => {
                const platform = socialPlatforms.find(p => p.id === connection.platform)
                return (
                  <div key={connection.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full ${platform?.color} flex items-center justify-center text-white text-xl`}>
                        {platform?.icon}
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{platform?.name}</h3>
                        <p className="text-sm text-gray-500">
                          Connected on {new Date(connection.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
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
      <Card>
        <CardHeader>
          <CardTitle>Available Platforms</CardTitle>
          <CardDescription>
            Connect your social media accounts to start publishing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {socialPlatforms.map((platform) => (
              <div key={platform.id} className="border rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`w-10 h-10 rounded-full ${platform.color} flex items-center justify-center text-white text-lg`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{platform.name}</h3>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">{platform.description}</p>
                <Button
                  className="w-full"
                  variant={isConnected(platform.id) ? "outline" : "default"}
                  onClick={() => handleConnect(platform.id)}
                  disabled={isConnected(platform.id)}
                >
                  {isConnected(platform.id) ? 'Connected' : 'Connect'}
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-gray-600">
            <p>• Make sure you have admin access to the social media accounts you want to connect</p>
            <p>• You can connect multiple accounts of the same platform</p>
            <p>• Connected accounts will be used for automatic publishing of scheduled content</p>
            <p>• You can disconnect accounts at any time</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
