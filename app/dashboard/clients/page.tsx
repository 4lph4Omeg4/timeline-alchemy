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

  useEffect(() => {
    const fetchClients = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's organization
        const { data: orgMember } = await (supabase as any)
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (!orgMember) return

        // Fetch clients for user's organization
        const { data: clientsData, error } = await (supabase as any)
          .from('clients')
          .select(`
            *,
            organizations(name, plan)
          `)
          .eq('org_id', (orgMember as any).org_id)
          .order('created_at', { ascending: false })

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
          Manage all client accounts
        </p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Clients</CardTitle>
          <CardDescription className="text-gray-300">
            {clients.length} clients found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No clients found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clients.map((client) => (
                <div key={client.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{client.name}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        <span>Email: {client.contact_info?.email || 'No email'}</span>
                        <Badge variant="secondary" className="bg-gray-600 text-gray-200">
                          {(client as any).organizations?.name || 'Unknown Org'}
                        </Badge>
                        <span>Created: {new Date(client.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
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
