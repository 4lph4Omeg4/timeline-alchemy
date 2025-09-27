'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Client } from '@/types/index'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Loader } from '@/components/Loader'

export default function AdminCreatePackagePage() {
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedClient, setSelectedClient] = useState<string>('')
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchClients = async () => {
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

        // Fetch all clients for this organization
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('*')
          .eq('org_id', orgMember.org_id)
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

    fetchClients()
  }, [])

  const handleSavePackage = async () => {
    if (!title.trim() || !content.trim() || !selectedClient) {
      toast.error('Please fill in all required fields')
      return
    }

    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in to create packages')
        return
      }

      // Get admin's organization
      const { data: orgMember } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (!orgMember) {
        toast.error('No organization found. Please create an organization first.')
        return
      }

      // Create the package for the selected client
      const { data: packageData, error: packageError } = await supabase
        .from('blog_posts')
        .insert({
          org_id: orgMember.org_id,
          client_id: selectedClient,
          title,
          content,
          state: 'draft',
          created_by_admin: true,
        })
        .select()
        .single()

      if (packageError) {
        console.error('Error creating package:', packageError)
        toast.error('Failed to create package')
        return
      }

      toast.success('Package created successfully for client!')
      router.push('/dashboard/admin/packages')
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setSaving(false)
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
        <h1 className="text-3xl font-bold text-white">Create Package for Client</h1>
        <p className="text-gray-300 mt-2">
          Create a content package that will be visible to your selected client.
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Package Details</CardTitle>
          <CardDescription className="text-gray-300">
            Fill in the content details for this client package.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="client" className="text-white">Client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-white">
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

          <div>
            <Label htmlFor="title" className="text-white">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              placeholder="Enter package title"
            />
          </div>

          <div>
            <Label htmlFor="content" className="text-white">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              rows={15}
              placeholder="Enter the main content for this package"
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/admin/packages')}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePackage}
              disabled={saving || !title.trim() || !content.trim() || !selectedClient}
            >
              {saving ? (
                <>
                  <Loader className="mr-2 h-4 w-4" />
                  Creating Package...
                </>
              ) : (
                'Create Package'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
