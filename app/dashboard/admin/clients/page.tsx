'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Client } from '@/types/index'
import toast from 'react-hot-toast'
import { Loader } from '@/components/Loader'

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')

  const fetchClients = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        setLoading(false)
        return
      }

      // Get admin's organizations (remove role filter to find any organization)
      const { data: orgMembers, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)

      if (orgError || !orgMembers || orgMembers.length === 0) {
        console.error('Error getting admin organizations:', orgError)
        toast.error('No organization found. Please contact support.')
        setLoading(false)
        return
      }

      // Fetch all clients (not just from admin's organization)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name')

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
        toast.error('Failed to fetch clients')
      } else {
        setClients(clientsData || [])
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClients()
  }, [])

  const handleCreateClient = async () => {
    if (!newClientName.trim()) {
      toast.error('Please enter a client name')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to create clients')
        return
      }

      // Get admin's organizations (remove role filter to find any organization)
      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)

      if (!orgMembers || orgMembers.length === 0) {
        toast.error('No organization found. Please contact support.')
        return
      }

      // Use the first organization found
      const orgId = orgMembers[0].org_id

      // Create the client
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          org_id: orgId,
          name: newClientName,
          contact_info: newClientEmail ? { email: newClientEmail } : null,
        })
        .select()
        .single()

      if (clientError) {
        console.error('Error creating client:', clientError)
        toast.error('Failed to create client')
        return
      }

      toast.success('Client created successfully!')
      setNewClientName('')
      setNewClientEmail('')
      fetchClients() // Refresh the list
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId)

      if (error) {
        console.error('Error deleting client:', error)
        toast.error('Failed to delete client')
      } else {
        toast.success('Client deleted successfully')
        fetchClients() // Refresh the list
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Manage Clients</h1>
          <p className="text-gray-300 mt-2">
            Create and manage clients for package assignment.
          </p>
        </div>
      </div>

      {/* Create Client Form */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Create New Client</CardTitle>
          <CardDescription className="text-gray-300">
            Add a new client to assign packages to.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client-name" className="text-white">Client Name</Label>
            <Input
              id="client-name"
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              placeholder="Enter client name"
            />
          </div>
          <div>
            <Label htmlFor="client-email" className="text-white">Email (Optional)</Label>
            <Input
              id="client-email"
              type="email"
              value={newClientEmail}
              onChange={(e) => setNewClientEmail(e.target.value)}
              className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              placeholder="Enter client email"
            />
          </div>
          <Button 
            onClick={handleCreateClient}
            disabled={saving || !newClientName.trim()}
          >
            {saving ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Creating Client...
              </>
            ) : (
              'Create Client'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Clients List */}
      {clients.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 text-center py-12">
          <CardTitle className="text-white">No Clients Found</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Start by creating clients to assign packages to.
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id} className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  {client.name}
                </CardTitle>
                <CardDescription className="text-gray-400">
                  {client.contact_info?.email && (
                    <div>Email: {client.contact_info.email}</div>
                  )}
                  <div>Created {new Date(client.created_at).toLocaleDateString()}</div>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteClient(client.id)}
                  className="w-full"
                >
                  Delete Client
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
