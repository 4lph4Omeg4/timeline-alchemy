'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/Loader'
import toast from 'react-hot-toast'

interface DebugInfo {
  user: any
  orgMembers: any[]
  organizations: any[]
  blogPosts: any[]
  clients: any[]
}

export default function DebugPackagesPage() {
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDebugInfo = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error getting user:', userError)
          setLoading(false)
          return
        }

        // Get user's organization memberships
        const { data: orgMembers, error: orgError } = await supabase
          .from('org_members')
          .select(`
            *,
            organizations (*)
          `)
          .eq('user_id', user.id)

        // Get all organizations (for admin)
        const { data: organizations, error: orgsError } = await supabase
          .from('organizations')
          .select('*')

        // Get all blog posts
        const { data: blogPosts, error: postsError } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false })

        // Get all clients
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*')

        setDebugInfo({
          user,
          orgMembers: orgMembers || [],
          organizations: organizations || [],
          blogPosts: blogPosts || [],
          clients: clients || []
        })

      } catch (error) {
        console.error('Unexpected error:', error)
        toast.error('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDebugInfo()
  }, [])

  const joinAdminOrg = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch('/api/auto-join-admin-org', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: user.id }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Successfully joined admin organization!')
        // Refresh the debug info
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to join admin organization')
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const createTestPackage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's organization
      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (!orgMember) {
        toast.error('No organization found')
        return
      }

      // Create a test package
      const { data, error } = await supabase
        .from('blog_posts')
        .insert({
          org_id: orgMember.org_id,
          title: 'Test Package - ' + new Date().toLocaleString(),
          content: 'This is a test package created for debugging purposes.',
          state: 'published',
          created_by_admin: true,
          published_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating test package:', error)
        toast.error('Failed to create test package: ' + error.message)
      } else {
        toast.success('Test package created successfully!')
        // Refresh the debug info
        window.location.reload()
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-16 w-16 text-primary" />
      </div>
    )
  }

  if (!debugInfo) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-white">Debug Packages</h1>
        <p className="text-gray-300">Failed to load debug information.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Debug Packages</h1>
          <p className="text-gray-300 mt-2">
            Debug information to understand why packages aren't showing up.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={joinAdminOrg}>
            Join Admin Organization
          </Button>
          <Button onClick={createTestPackage}>
            Create Test Package
          </Button>
        </div>
      </div>

      {/* User Info */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">User Information</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-gray-300 text-sm overflow-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Organization Memberships */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Organization Memberships</CardTitle>
          <CardDescription className="text-gray-300">
            User's organization memberships: {debugInfo.orgMembers.length}
            {debugInfo.orgMembers.some(m => m.organizations?.name === 'Admin Organization') && (
              <span className="text-green-400 ml-2">✅ In Admin Organization</span>
            )}
            {!debugInfo.orgMembers.some(m => m.organizations?.name === 'Admin Organization') && (
              <span className="text-red-400 ml-2">❌ NOT in Admin Organization</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-gray-300 text-sm overflow-auto">
            {JSON.stringify(debugInfo.orgMembers, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* All Organizations */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Organizations</CardTitle>
          <CardDescription className="text-gray-300">
            Total organizations: {debugInfo.organizations.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-gray-300 text-sm overflow-auto">
            {JSON.stringify(debugInfo.organizations, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Blog Posts */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Blog Posts</CardTitle>
          <CardDescription className="text-gray-300">
            Total posts: {debugInfo.blogPosts.length} | 
            Admin packages: {debugInfo.blogPosts.filter(p => p.created_by_admin).length} |
            User posts: {debugInfo.blogPosts.filter(p => !p.created_by_admin).length}
            <br />
            Admin packages in Admin Organization: {debugInfo.blogPosts.filter(p => p.created_by_admin && p.org_id === debugInfo.orgMembers.find(m => m.organizations?.name === 'Admin Organization')?.org_id).length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-gray-300 text-sm overflow-auto max-h-96">
            {JSON.stringify(debugInfo.blogPosts, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Clients */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Clients</CardTitle>
          <CardDescription className="text-gray-300">
            Total clients: {debugInfo.clients.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-gray-300 text-sm overflow-auto">
            {JSON.stringify(debugInfo.clients, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
