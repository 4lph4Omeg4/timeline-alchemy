'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { TokenManager, TokenStatus } from '@/lib/token-manager'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle } from 'lucide-react'

export default function TokenStatusPage() {
  const [tokenStatuses, setTokenStatuses] = useState<TokenStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState<string | null>(null)
  const [userOrgId, setUserOrgId] = useState<string | null>(null)

  useEffect(() => {
    fetchUserOrg()
  }, [])

  // Helper function to get user's personal organization ID (same as socials page)
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

  const fetchUserOrg = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's personal organization ID (same logic as socials page)
      const userOrgId = await getUserOrgId(user.id)
      if (!userOrgId) {
        console.error('No organization found for user')
        return
      }

      setUserOrgId(userOrgId)
      fetchTokenStatus(userOrgId)
    } catch (error) {
      console.error('Error fetching user org:', error)
    }
  }

        const fetchTokenStatus = async (orgId: string) => {
          setLoading(true)
          try {
            console.log('🔍 Fetching token status for org:', orgId)
            
            // First, let's debug what connections exist
            const { data: connections, error } = await supabase
              .from('social_connections')
              .select('*')
              .eq('org_id', orgId)
            
            console.log('🔗 Raw connections found:', connections)
            console.log('❌ Raw connections error:', error)
            
            // Create statuses manually since TokenManager might have issues
            const statuses: TokenStatus[] = []
            for (const connection of connections || []) {
              const now = new Date()
              let isExpired = false
              let needsRefresh = false
              let expiresAt: Date | undefined

              // Check token expiry based on platform
              switch (connection.platform) {
                case 'twitter':
                  // Twitter OAuth 1.0a tokens are long-lived and don't expire in the same way
                  needsRefresh = false
                  break
                case 'linkedin':
                  const linkedinAge = now.getTime() - new Date(connection.created_at).getTime()
                  needsRefresh = linkedinAge > 50 * 24 * 60 * 60 * 1000 // 50 days
                  break
                case 'facebook':
                case 'instagram':
                case 'youtube':
                case 'discord':
                case 'reddit':
                  needsRefresh = false
                  break
                case 'telegram':
                case 'wordpress':
                  needsRefresh = false
                  break
                default:
                  console.warn(`Unknown platform for token status check: ${connection.platform}`)
                  break
              }

              statuses.push({
                platform: connection.platform,
                accountId: connection.account_id,
                accountName: connection.account_name,
                isExpired: isExpired,
                expiresAt: expiresAt,
                lastChecked: now,
                needsRefresh: needsRefresh,
              })
            }
            
            console.log('📊 Token statuses:', statuses)
            setTokenStatuses(statuses)
          } catch (error) {
            console.error('Error fetching token status:', error)
          } finally {
            setLoading(false)
          }
        }


  const handleRefreshToken = async (platform: string, accountId: string) => {
    if (!userOrgId) return

    setRefreshing(`${platform}-${accountId}`)
    try {
      // Call the refresh API endpoint
      const response = await fetch('/api/refresh-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: userOrgId,
          platform: platform,
          accountId: accountId
        })
      })

      const result = await response.json()
      if (result.success) {
        console.log(`Successfully refreshed token for ${platform} ${accountId}`)
        // Re-fetch all statuses to update the UI
        fetchTokenStatus(userOrgId)
      } else {
        console.error(`Failed to refresh token for ${platform} ${accountId}: ${result.error}`)
        alert(`Failed to refresh ${platform} token: ${result.error}`)
      }
    } catch (error) {
      console.error(`Error refreshing token for ${platform} ${accountId}:`, error)
      alert(`Error refreshing ${platform} token`)
    } finally {
      setRefreshing(null)
    }
  }

  const getStatusIcon = (status: TokenStatus) => {
    if (status.needsRefresh) {
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />
  }

  const getStatusBadge = (status: TokenStatus) => {
    if (status.needsRefresh) {
      return <Badge variant="destructive">Needs Refresh</Badge>
    }
    return <Badge variant="default">Healthy</Badge>
  }

  const getPlatformColor = (platform: string) => {
    const colors: Record<string, string> = {
      twitter: 'bg-blue-500',
      linkedin: 'bg-blue-600',
      discord: 'bg-indigo-500',
      reddit: 'bg-orange-500',
      telegram: 'bg-blue-400',
      facebook: 'bg-blue-700',
      instagram: 'bg-pink-500',
      youtube: 'bg-red-500'
    }
    return colors[platform] || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-purple-500" />
          <span className="ml-2 text-lg">Loading token status...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Token Status Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Monitor and manage your social media connection tokens
          </p>
        </div>
        <Button 
          onClick={() => fetchUserOrg()}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {tokenStatuses.length === 0 ? (
        <Card className="p-8 text-center">
          <XCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No Social Connections</h3>
          <p className="text-gray-500">
            You haven't connected any social media accounts yet. 
            <a href="/dashboard/socials" className="text-purple-600 hover:underline ml-1">
              Connect your accounts
            </a>
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tokenStatuses.map((status, index) => (
            <Card key={index} className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full ${getPlatformColor(status.platform)} flex items-center justify-center text-white font-bold`}>
                    {status.platform.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold capitalize">{status.platform}</h3>
                    <p className="text-sm text-gray-600">{status.accountName}</p>
                  </div>
                </div>
                {getStatusIcon(status)}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Status:</span>
                  {getStatusBadge(status)}
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Checked:</span>
                  <span className="text-sm">
                    {new Date(status.lastChecked).toLocaleString()}
                  </span>
                </div>

                {status.expiresAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Expires:</span>
                    <span className="text-sm">
                      {new Date(status.expiresAt).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {status.needsRefresh && (
                <Button
                  onClick={() => handleRefreshToken(status.platform, status.accountId)}
                  disabled={refreshing === `${status.platform}-${status.accountId}`}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {refreshing === `${status.platform}-${status.accountId}` ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Token
                    </>
                  )}
                </Button>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Healthy Tokens</h3>
              <p className="text-2xl font-bold text-green-600">
                {tokenStatuses.filter(s => !s.needsRefresh).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
            <div>
              <h3 className="text-lg font-semibold">Need Refresh</h3>
              <p className="text-2xl font-bold text-yellow-600">
                {tokenStatuses.filter(s => s.needsRefresh).length}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="text-lg font-semibold">Total Connections</h3>
              <p className="text-2xl font-bold text-blue-600">
                {tokenStatuses.length}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
