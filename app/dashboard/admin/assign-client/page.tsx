'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Client } from '@/types/index'
import toast from 'react-hot-toast'
import { Loader } from '@/components/Loader'

interface User {
  id: string
  email: string
  user_metadata: {
    name?: string
  }
  created_at: string
}

export default function AssignClientPage() {
  const [users, setUsers] = useState<User[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          console.error('Error getting user:', userError)
          setLoading(false)
          return
        }

        // Get admin's organization
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .eq('role', 'owner')
          .single()

        if (orgError || !orgMember) {
          console.error('Error getting admin organization:', orgError)
          setLoading(false)
          return
        }

        // Fetch all clients
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

        // Fetch all users in the organization via API
        const response = await fetch(`/api/admin/users?orgId=${orgMember.org_id}&currentUserId=${user.id}`)
        
        if (!response.ok) {
          console.error('Error fetching users:', response.statusText)
          toast.error('Failed to fetch users')
        } else {
          const { users } = await response.json()
          console.log('Fetched users:', users)
          setUsers(users || [])
        }

      } catch (error) {
        console.error('Unexpected error:', error)
        toast.error('An unexpected error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAssignClient = async () => {
    if (!selectedUser || !selectedClient) {
      toast.error('Please select both a user and a client')
      return
    }

    setAssigning(true)
    try {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('user_clients')
        .select('id')
        .eq('user_id', selectedUser)
        .eq('client_id', selectedClient)
        .single()

      if (existing) {
        toast.error('This user is already assigned to this client')
        return
      }

      // Create the assignment
      const { error } = await supabase
        .from('user_clients')
        .insert({
          user_id: selectedUser,
          client_id: selectedClient,
        })

      if (error) {
        console.error('Error assigning client:', error)
        toast.error('Failed to assign client')
        return
      }

      toast.success('Client assigned successfully!')
      setSelectedUser('')
      setSelectedClient('')
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setAssigning(false)
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Assign Client to User</h1>
        <p className="text-gray-300 mt-2">
          Link users to client records so they can see admin-created packages.
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Create Client Assignment</CardTitle>
          <CardDescription className="text-gray-300">
            Select a user and assign them to a client record.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-white block mb-2">Select User</label>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.user_metadata?.name || user.email} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-white block mb-2">Select Client</label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleAssignClient}
            disabled={assigning || !selectedUser || !selectedClient}
            className="w-full"
          >
            {assigning ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Assigning Client...
              </>
            ) : (
              'Assign Client to User'
            )}
          </Button>
        </CardContent>
      </Card>

      {users.length === 0 && (
        <Card className="bg-gray-900 border-gray-800 text-center py-12">
          <CardTitle className="text-white">No Users Found</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            No users found in your organization to assign clients to.
          </CardDescription>
        </Card>
      )}

      {clients.length === 0 && (
        <Card className="bg-gray-900 border-gray-800 text-center py-12">
          <CardTitle className="text-white">No Clients Found</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Create clients first in the "Manage Clients" section.
          </CardDescription>
        </Card>
      )}
    </div>
  )
}
