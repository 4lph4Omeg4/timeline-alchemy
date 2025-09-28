'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import toast from 'react-hot-toast'

export default function DebugAuthPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [orgMemberships, setOrgMemberships] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
        
        // Check user
        const { data: userData, error: userError } = await supabase.auth.getUser()
        
        // Check org memberships
        const { data: orgData, error: orgError } = await supabase
          .from('org_members')
          .select('*, organizations(*)')
          .eq('user_id', userData.user?.id || '')
        
        setAuthState({
          session: sessionData.session,
          sessionError,
          user: userData.user,
          userError,
          orgMemberships: orgData || [],
          orgError
        })
        
        setOrgMemberships(orgData || [])
        
      } catch (error) {
        console.error('Debug auth error:', error)
        setAuthState({ error: error.message })
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleRefreshSession = async () => {
    try {
      const { error } = await supabase.auth.refreshSession()
      if (error) {
        toast.error('Session refresh failed: ' + error.message)
      } else {
        toast.success('Session refreshed successfully')
        // Reload the page to see updated state
        window.location.reload()
      }
    } catch (error) {
      toast.error('Session refresh error: ' + error.message)
    }
  }

  const handleJoinAdminOrg = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('No user found')
        return
      }

      const response = await fetch('/api/auto-join-admin-org', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })

      const data = await response.json()
      
      if (response.ok) {
        toast.success('Successfully joined admin organization')
        window.location.reload()
      } else {
        toast.error('Failed to join admin organization: ' + data.error)
      }
    } catch (error) {
      toast.error('Error joining admin organization: ' + error.message)
    }
  }

  if (loading) {
    return <div className="p-6">Loading debug info...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Auth Debug Page</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Status</CardTitle>
            <CardDescription>Current authentication session</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-800 p-4 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(authState?.session, null, 2)}
            </pre>
            {authState?.sessionError && (
              <div className="mt-2 text-red-400">
                Session Error: {authState.sessionError.message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User Info</CardTitle>
            <CardDescription>Current user data</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-800 p-4 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(authState?.user, null, 2)}
            </pre>
            {authState?.userError && (
              <div className="mt-2 text-red-400">
                User Error: {authState.userError.message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organization Memberships</CardTitle>
            <CardDescription>User's organization memberships</CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-800 p-4 rounded text-sm text-gray-300 overflow-auto">
              {JSON.stringify(orgMemberships, null, 2)}
            </pre>
            {authState?.orgError && (
              <div className="mt-2 text-red-400">
                Org Error: {authState.orgError.message}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Debug actions</CardDescription>
          </CardHeader>
          <CardContent className="space-x-4">
            <Button onClick={handleRefreshSession} variant="outline">
              Refresh Session
            </Button>
            <Button onClick={handleJoinAdminOrg} variant="outline">
              Join Admin Organization
            </Button>
            <Button onClick={() => window.location.reload()} variant="outline">
              Reload Page
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
