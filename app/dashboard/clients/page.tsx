'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Client } from '@/types/index'

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Check if user is admin
        const isAdminUser = user.email === 'sh4m4ni4k@sh4m4ni4k.nl'
        setIsAdmin(isAdminUser)

        let clientsData, error

        if (isAdminUser) {
          // Admin: fetch all clients from all organizations
          const result = await (supabase as any)
            .from('clients')
            .select(`
              *,
              organizations(name, plan)
            `)
            .order('created_at', { ascending: false })
          
          clientsData = result.data
          error = result.error
          console.log('Admin clients query result:', { clientsData, error })
        } else {
          // Regular user: get user's organizations
          const { data: orgMembers } = await (supabase as any)
            .from('org_members')
            .select('org_id')
            .eq('user_id', user.id)

          if (!orgMembers || orgMembers.length === 0) {
            console.log('No organizations found for user')
            setClients([])
            return
          }

          // Get all organization IDs the user belongs to
          const orgIds = orgMembers.map((member: any) => member.org_id)

          // Fetch clients for all user's organizations
          const result = await (supabase as any)
            .from('clients')
            .select(`
              *,
              organizations(name, plan)
            `)
            .in('org_id', orgIds)
            .order('created_at', { ascending: false })
          
          clientsData = result.data
          error = result.error
          console.log('User clients query result:', { clientsData, error, orgIds })
        }

        if (clientsData) {
          setClients(clientsData)
        }
      } catch (error) {
        console.error('Error fetching clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
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
        <h1 className="text-3xl font-bold text-white">Clients</h1>
        <p className="text-gray-300 mt-2">
          {isAdmin ? 'Manage all client accounts across all organizations' : 'Manage your organization\'s client accounts'}
        </p>
      </div>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">
                {isAdmin ? 'All Clients' : 'My Clients'}
              </CardTitle>
              <CardDescription className="text-gray-200">
                {clients.length} clients found
              </CardDescription>
            </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">
                {isAdmin ? 'No clients found across all organizations' : 'No clients found in your organization'}
              </p>
              {!isAdmin && (
                <p className="text-gray-500 text-sm mt-2">
                  If you believe this is an error, please contact support.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="border border-gray-700 rounded-lg p-4 bg-gray-800">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{client.name}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-300">
                        <span>Email: {client.contact_info?.email || 'No email'}</span>
                        <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                          {(client as any).organizations?.name || 'Unknown Org'}
                        </Badge>
                        <span>Created: {new Date(client.created_at).toLocaleDateString()}</span>
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
