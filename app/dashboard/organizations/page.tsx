'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Organization } from '@/types/index'
import toast from 'react-hot-toast'

interface Client {
  id: string
  name: string
  contact_info: any
  org_id: string | null
  created_at: string
  organizations?: Array<{ name: string }>
}

interface OrganizationWithClients extends Organization {
  clients: Client[]
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<OrganizationWithClients[]>([])
  const [clientsWithoutOrg, setClientsWithoutOrg] = useState<Client[]>([])
  const [allClients, setAllClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // Fetch organizations with their subscriptions and clients
        const { data: orgsWithSubs, error } = await (supabase as any)
          .from('organizations')
          .select(`
            *,
            subscriptions(
              id,
              plan,
              status,
              created_at
            ),
            clients(
              id,
              name,
              contact_info,
              org_id,
              created_at
            )
          `)
          .order('created_at', { ascending: false })

        // Fetch ALL clients to check which ones don't have their own organization
        const { data: allClientsData, error: clientsError } = await (supabase as any)
          .from('clients')
          .select(`
            *,
            organizations(name)
          `)
          .order('created_at', { ascending: false })

        if (orgsWithSubs) {
          // Filter out Admin Organization and update organizations with subscription plan and clients
          const nonAdminOrgs = orgsWithSubs
            .filter((org: any) => org.name !== 'Admin Organization')
            .map((org: any) => ({
              ...org,
              plan: org.subscriptions && org.subscriptions.length > 0
                ? org.subscriptions[0].plan
                : org.plan,
              clients: org.clients || []
            }))
          setOrganizations(nonAdminOrgs)
        }

        if (allClientsData) {
          // Filter out clients that are only in Admin Organization
          const nonAdminClients = allClientsData.filter((client: any) => {
            // Check if this client has any organization other than Admin Organization
            const hasNonAdminOrg = client.organizations && Array.isArray(client.organizations) && client.organizations.some((org: any) =>
              org.name !== 'Admin Organization'
            )
            return hasNonAdminOrg
          })
          // Store filtered clients for manual assignment
          setAllClients(nonAdminClients)

          // Filter clients that don't have their own organization
          const clientsWithoutOwnOrg = allClientsData.filter((client: any) => {
            // Check if this client has any organization other than Admin Organization
            const hasOwnOrg = client.organizations && Array.isArray(client.organizations) && client.organizations.some((org: any) =>
              org.name !== 'Admin Organization'
            )
            return !hasOwnOrg
          })
          setClientsWithoutOrg(clientsWithoutOwnOrg)
        }
      } catch (error) {
        console.error('Error fetching organizations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  const createOrganizationForClient = async (client: Client) => {
    try {
      // Create new organization
      const { data: newOrg, error: orgError } = await (supabase as any)
        .from('organizations')
        .insert({
          name: `${client.name}'s Organization`,
          plan: 'basic'
        })
        .select()
        .single()

      if (orgError) {
        console.error('Error creating organization:', orgError)
        toast.error('Failed to create organization')
        return
      }

      // Update client with new organization
      const { error: clientError } = await (supabase as any)
        .from('clients')
        .update({ org_id: newOrg.id })
        .eq('id', client.id)

      if (clientError) {
        console.error('Error updating client:', clientError)
        toast.error('Failed to assign client to organization')
        return
      }

      // Create subscription for the new organization
      await (supabase as any)
        .from('subscriptions')
        .insert({
          org_id: newOrg.id,
          stripe_customer_id: 'temp-customer-' + newOrg.id,
          stripe_subscription_id: 'temp-sub-' + newOrg.id,
          plan: 'basic',
          status: 'active'
        })

      toast.success(`Organization created for ${client.name}`)

      // Refresh the data
      const fetchOrganizations = async () => {
        try {
          const { data: orgsWithSubs, error } = await (supabase as any)
            .from('organizations')
            .select(`
              *,
              subscriptions(
                id,
                plan,
                status,
                created_at
              ),
              clients(
                id,
                name,
                contact_info,
                org_id,
                created_at
              )
            `)
            .order('created_at', { ascending: false })

          const { data: allClientsData, error: clientsError } = await (supabase as any)
            .from('clients')
            .select(`
              *,
              organizations(name)
            `)
            .order('created_at', { ascending: false })

          if (orgsWithSubs) {
            // Filter out Admin Organization and update organizations with subscription plan and clients
            const nonAdminOrgs = orgsWithSubs
              .filter((org: any) => org.name !== 'Admin Organization')
              .map((org: any) => ({
                ...org,
                plan: org.subscriptions && org.subscriptions.length > 0
                  ? org.subscriptions[0].plan
                  : org.plan,
                clients: org.clients || []
              }))
            setOrganizations(nonAdminOrgs)
          }

          if (allClientsData) {
            // Filter clients that don't have their own organization
            const clientsWithoutOwnOrg = allClientsData.filter((client: any) => {
              // Check if this client has any organization other than Admin Organization
              const hasOwnOrg = client.organizations && client.organizations.some((org: any) =>
                org.name !== 'Admin Organization'
              )
              return !hasOwnOrg
            })
            setClientsWithoutOrg(clientsWithoutOwnOrg)
          }
        } catch (error) {
          console.error('Error refreshing data:', error)
        }
      }

      fetchOrganizations()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  const assignClientToOrganization = async (clientId: string, organizationId: string) => {
    try {
      const { error } = await (supabase as any)
        .from('clients')
        .update({ org_id: organizationId })
        .eq('id', clientId)

      if (error) {
        console.error('Error assigning client to organization:', error)
        toast.error('Failed to assign client to organization')
        return
      }

      toast.success('Client assigned to organization successfully')

      // Refresh the data
      const fetchOrganizations = async () => {
        try {
          const { data: orgsWithSubs, error } = await (supabase as any)
            .from('organizations')
            .select(`
              *,
              subscriptions(
                id,
                plan,
                status,
                created_at
              ),
              clients(
                id,
                name,
                contact_info,
                org_id,
                created_at
              )
            `)
            .order('created_at', { ascending: false })

          const { data: allClientsData, error: clientsError } = await (supabase as any)
            .from('clients')
            .select(`
              *,
              organizations(name)
            `)
            .order('created_at', { ascending: false })

          if (orgsWithSubs) {
            // Filter out Admin Organization and update organizations with subscription plan and clients
            const nonAdminOrgs = orgsWithSubs
              .filter((org: any) => org.name !== 'Admin Organization')
              .map((org: any) => ({
                ...org,
                plan: org.subscriptions && org.subscriptions.length > 0
                  ? org.subscriptions[0].plan
                  : org.plan,
                clients: org.clients || []
              }))
            setOrganizations(nonAdminOrgs)
          }

          if (allClientsData) {
            // Filter out clients that are only in Admin Organization
            const nonAdminClients = allClientsData.filter((client: any) => {
              // Check if this client has any organization other than Admin Organization
              const hasNonAdminOrg = client.organizations && Array.isArray(client.organizations) && client.organizations.some((org: any) =>
                org.name !== 'Admin Organization'
              )
              return hasNonAdminOrg
            })
            // Store filtered clients for manual assignment
            setAllClients(nonAdminClients)

            // Filter clients that don't have their own organization
            const clientsWithoutOwnOrg = allClientsData.filter((client: any) => {
              // Check if this client has any organization other than Admin Organization
              const hasOwnOrg = client.organizations && Array.isArray(client.organizations) && client.organizations.some((org: any) =>
                org.name !== 'Admin Organization'
              )
              return !hasOwnOrg
            })
            setClientsWithoutOrg(clientsWithoutOwnOrg)
          }
        } catch (error) {
          console.error('Error refreshing data:', error)
        }
      }

      fetchOrganizations()
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

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
        <h1 className="text-3xl font-bold text-white">Client Organizations</h1>
        <p className="text-gray-300 mt-2">
          Manage client organizations and assign clients to organizations
        </p>
      </div>

      {/* All Available Clients for Manual Assignment */}
      {allClients.length > 0 && (
        <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-white">👥 All Available Clients</CardTitle>
            <CardDescription className="text-blue-200">
              {allClients.length} clients available for manual assignment to organizations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {allClients.map((client) => {
                const currentOrg = client.organizations && Array.isArray(client.organizations)
                  ? client.organizations.find((org: any) => org.name !== 'Admin Organization')
                  : null
                return (
                  <div key={client.id} className="flex items-center justify-between p-4 bg-blue-800/20 border border-blue-500/30 rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{client.name}</h4>
                      <p className="text-blue-200 text-sm">
                        Email: {client.contact_info?.email || 'No email provided'}
                      </p>
                      <p className="text-blue-300 text-xs">
                        Current Org: {currentOrg?.name || 'Admin Organization only'}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <select
                        className="bg-gray-800 border border-gray-600 text-white px-3 py-2 rounded-lg text-sm"
                        onChange={(e) => {
                          if (e.target.value) {
                            assignClientToOrganization(client.id, e.target.value)
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="">Assign to...</option>
                        {organizations.map((org) => (
                          <option key={org.id} value={org.id}>
                            {org.name}
                          </option>
                        ))}
                      </select>
                      {!currentOrg && (
                        <Button
                          onClick={() => createOrganizationForClient(client)}
                          className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white text-sm"
                        >
                          ✨ Create New Org
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Client Organizations</CardTitle>
          <CardDescription className="text-gray-200">
            {organizations.length} client organizations found (excluding Admin Organization)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300">No client organizations found</p>
              <p className="text-gray-400 text-sm mt-2">All clients are currently without their own organization</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div key={org.id} className="border border-gray-700 rounded-lg p-6 bg-gray-800 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{org.name}</h3>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <Badge
                          variant="secondary"
                          className={`font-medium ${org.plan === 'transcendant' ? 'bg-pink-700 text-pink-200' :
                              org.plan === 'initiate' ? 'bg-blue-700 text-blue-200' :
                                'bg-gray-700 text-gray-200'
                            }`}
                        >
                          {org.plan?.charAt(0).toUpperCase() + org.plan?.slice(1) || 'Basic'}
                        </Badge>
                        <span className="text-gray-300">
                          Created: {new Date(org.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-gray-300">
                          ID: {org.id.slice(0, 8)}...
                        </span>
                        <Badge className="bg-green-600 text-white">
                          {org.clients.length} client{org.clients.length !== 1 ? 's' : ''}
                        </Badge>
                      </div>

                      {/* Show clients linked to this organization */}
                      {org.clients.length > 0 && (
                        <div className="mt-4">
                          <h4 className="text-white font-medium mb-2">👥 Linked Clients:</h4>
                          <div className="space-y-2">
                            {org.clients.map((client) => (
                              <div key={client.id} className="flex items-center justify-between p-3 bg-gray-700/50 border border-gray-600 rounded-lg">
                                <div className="flex-1">
                                  <p className="text-white font-medium">{client.name}</p>
                                  <p className="text-gray-300 text-sm">
                                    {client.contact_info?.email || 'No email provided'}
                                  </p>
                                </div>
                                <Badge className="bg-green-600 text-white text-xs">
                                  Active
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
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
