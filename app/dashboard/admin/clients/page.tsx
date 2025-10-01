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
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientEmail, setNewClientEmail] = useState('')
  const [selectedOrgId, setSelectedOrgId] = useState('')
  const [newOrgName, setNewOrgName] = useState('')
  const [showNewOrgField, setShowNewOrgField] = useState(false)

  const fetchClients = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        setLoading(false)
        return
      }

      // Fetch all clients from admin organization (global clients)
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select(`
          *,
          organizations(name)
        `)
        .order('name')

      if (clientsError) {
        console.error('Error fetching clients:', clientsError)
        toast.error('Failed to fetch clients')
      } else {
        setClients(clientsData || [])
      }

      // Fetch organizations for assignment
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select('id, name')
        .neq('name', 'Admin Organization')
        .order('name')

      if (orgsError) {
        console.error('Error fetching organizations:', orgsError)
      } else {
        setOrganizations(orgsData || [])
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

      // Find the admin organization (where all clients should be created)
      const { data: adminOrg } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Admin Organization')
        .single()

      if (!adminOrg) {
        toast.error('Admin organization not found. Please contact support.')
        return
      }

      const adminOrgId = adminOrg.id

      // Create the client in admin organization first
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          org_id: adminOrgId,
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

      // Handle organization assignment
      if (selectedOrgId) {
        // Add client to existing organization
        const { error: orgMemberError } = await supabase
          .from('org_members')
          .insert({
            org_id: selectedOrgId,
            user_id: clientData.id, // Using client ID as user_id for org_members
            role: 'client'
          })

        if (orgMemberError) {
          console.error('Error adding client to organization:', orgMemberError)
          toast.success('Client created but failed to assign to organization')
        } else {
          toast.success('Client created and assigned to organization successfully!')
        }
      } else if (newOrgName.trim()) {
        // Create new organization and assign client
        const { data: newOrgData, error: newOrgError } = await supabase
          .from('organizations')
          .insert({
            name: newOrgName.trim(),
            plan: 'basic'
          })
          .select()
          .single()

        if (newOrgError) {
          console.error('Error creating organization:', newOrgError)
          toast.success('Client created but failed to create organization')
        } else {
          // Add client to the new organization
          const { error: orgMemberError } = await supabase
            .from('org_members')
            .insert({
              org_id: newOrgData.id,
              user_id: clientData.id,
              role: 'client'
            })

          if (orgMemberError) {
            console.error('Error adding client to new organization:', orgMemberError)
            toast.success('Client and organization created but failed to assign client')
          } else {
            toast.success('Client created and assigned to new organization successfully!')
          }
        }
      } else {
        toast.success('Client created successfully!')
      }

      setNewClientName('')
      setNewClientEmail('')
      setSelectedOrgId('')
      setNewOrgName('')
      setShowNewOrgField(false)
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
          <div>
            <Label htmlFor="client-org" className="text-white">Assign to Organization (Optional)</Label>
            <select
              id="client-org"
              value={selectedOrgId}
              onChange={(e) => {
                setSelectedOrgId(e.target.value)
                if (e.target.value) {
                  setShowNewOrgField(false)
                  setNewOrgName('')
                }
              }}
              className="mt-2 w-full bg-gray-700 border border-gray-600 text-white px-3 py-2 rounded-md focus:border-purple-400 focus:ring-purple-400/50"
            >
              <option value="">No organization assignment</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
            
            {/* Create New Organization Option */}
            <div className="mt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowNewOrgField(!showNewOrgField)
                  if (!showNewOrgField) {
                    setSelectedOrgId('')
                  }
                }}
                className="border-purple-500/50 text-purple-300 hover:bg-purple-600/30"
              >
                {showNewOrgField ? 'Cancel New Organization' : '+ Create New Organization'}
              </Button>
            </div>

            {showNewOrgField && (
              <div className="mt-3 p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <Label htmlFor="new-org-name" className="text-purple-200 text-sm">New Organization Name</Label>
                <Input
                  id="new-org-name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="mt-2 bg-gray-700 border-purple-500/50 text-white placeholder-gray-400 focus:border-purple-400 focus:ring-purple-400/50"
                  placeholder="Enter organization name"
                />
                <p className="text-purple-300 text-xs mt-1">
                  This will create a new organization and assign the client to it.
                </p>
              </div>
            )}

            <p className="text-gray-400 text-sm mt-1">
              Clients are always created in the Admin Organization. This assigns them to an additional organization.
            </p>
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
                  <div>Organization: {client.organizations?.name || 'Unknown'}</div>
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
