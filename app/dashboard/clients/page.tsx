'use member'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { member } from '@/types/index'

export default function membersPage() {
  const [members, setmembers] = useState<member[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchmembers = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if user is admin
        const isAdminUser = user.email === 'sh4m4ni4k@sh4m4ni4k.nl'
        setIsAdmin(isAdminUser)

        let membersData, error

        if (isAdminUser) {
          // Admin: fetch all members from all organizations
          const result = await (supabase as any)
            .from('members')
            .select(`
              *,
              organizations(name, plan)
            `)
            .order('created_at', { ascending: false })
          
          membersData = result.data
          error = result.error
          console.log('Admin members query result:', { membersData, error })
        } else {
          // Regular user: get user's organizations
          const { data: orgMembers } = await (supabase as any)
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)

          if (!orgMembers || orgMembers.length === 0) {
            console.log('No organizations found for user')
            setmembers([])
            return
          }

          // Get all organization IDs the user belongs to
          const orgIds = orgMembers.map((member: any) => member.org_id)

          // Fetch members for all user's organizations
          const result = await (supabase as any)
            .from('members')
            .select(`
              *,
              organizations(name, plan)
            `)
            .in('org_id', orgIds)
            .order('created_at', { ascending: false })
          
          membersData = result.data
          error = result.error
          console.log('User members query result:', { membersData, error, orgIds })
        }

        if (membersData) {
          setmembers(membersData)
        }
      } catch (error) {
        console.error('Error fetching members:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchmembers()
  }, [])

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
        <h1 className="text-3xl font-bold text-white">members</h1>
        <p className="text-gray-300 mt-2">
          {isAdmin ? 'Manage all member accounts across all organizations' : 'Manage your organization\'s member accounts'}
        </p>
      </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                {isAdmin ? 'All members' : 'My members'}
              </CardTitle>
              <CardDescription className="text-gray-200">
                {members.length} members found
              </CardDescription>
            </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {isAdmin ? 'No members found across all organizations' : 'No members found in your organization'}
              </p>
              {!isAdmin && (
                <p className="text-gray-500 text-sm mt-2">
                  If you believe this is an error, please contact support.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {members.map((member) => (
                <div key={member.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{member.name}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                        <span>Email: {member.contact_info?.email || 'No email'}</span>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                          {(member as any).organizations?.name || 'Unknown Org'}
                        </Badge>
                        <span>Created: {new Date(member.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
