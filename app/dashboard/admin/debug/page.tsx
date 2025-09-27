'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader } from '@/components/Loader'

export default function DebugPage() {
  const [debugData, setDebugData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDebugData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error getting user:', userError)
          setLoading(false)
          return
        }

        console.log('Current user:', user)

        // Get user's organization
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id, role')
          .eq('user_id', user.id)
          .single()

        console.log('Org member data:', orgMember, 'Error:', orgError)

        // Get organization details
        let orgData = null
        if (orgMember) {
          const { data: org, error: orgErr } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', orgMember.org_id)
            .single()
          
          orgData = org
          console.log('Organization data:', org, 'Error:', orgErr)
        }

        // Get all clients
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('*')

        console.log('Clients data:', clients, 'Error:', clientsError)

        // Get all org members
        const { data: orgMembers, error: membersError } = await supabase
          .from('org_members')
          .select('*')

        console.log('All org members:', orgMembers, 'Error:', membersError)

        // Get all blog posts
        const { data: blogPosts, error: postsError } = await supabase
          .from('blog_posts')
          .select('*')

        console.log('All blog posts:', blogPosts, 'Error:', postsError)

        // Get user_clients relationships
        const { data: userClients, error: userClientsError } = await supabase
          .from('user_clients')
          .select('*')

        console.log('User clients relationships:', userClients, 'Error:', userClientsError)

        // Test if client_id column exists in blog_posts
        const { data: testPosts, error: testError } = await supabase
          .from('blog_posts')
          .select('id, title, created_by_admin, client_id')
          .limit(5)

        console.log('Test posts with new columns:', testPosts, 'Error:', testError)

        // Get database migration status
        let databaseInfo = null
        try {
          const dbResponse = await fetch('/api/debug/database')
          if (dbResponse.ok) {
            databaseInfo = await dbResponse.json()
          }
        } catch (error) {
          console.error('Error fetching database info:', error)
        }

        setDebugData({
          user,
          orgMember,
          organization: orgData,
          clients,
          orgMembers,
          blogPosts,
          userClients,
          testPosts,
          databaseInfo,
          errors: {
            userError,
            orgError,
            clientsError,
            membersError,
            postsError,
            userClientsError,
            testError
          }
        })

      } catch (error) {
        console.error('Unexpected error:', error)
        setDebugData({ error: error instanceof Error ? error.message : String(error) })
      } finally {
        setLoading(false)
      }
    }

    fetchDebugData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-16 w-16 text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Debug Information</h1>
        <p className="text-gray-300 mt-2">
          This page shows all the data in your database to help debug issues.
        </p>
      </div>

      {Object.entries(debugData).map(([key, value]) => (
        <Card key={key} className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">{key}</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-gray-300 text-sm overflow-auto max-h-96">
              {JSON.stringify(value, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
