'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Organization, Client } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import { Modal } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [editOrgModal, setEditOrgModal] = useState(false)
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null)
  const [newOrgName, setNewOrgName] = useState('')
  const router = useRouter()

  const ensureAdminOrganization = async (userId: string) => {
    try {
      // First, check if "Admin Organization" organization already exists
      const { data: existingAdminOrg, error: orgCheckError } = await (supabase as any)
        .from('organizations')
        .select('id')
        .eq('name', 'Admin Organization')
        .single()

      if (existingAdminOrg) {
        // Organization exists, check if admin is already a member
        const { data: existingMember, error: memberCheckError } = await (supabase as any)
          .from('org_members')
          .select('id')
          .eq('user_id', userId)
          .eq('org_id', existingAdminOrg.id)
          .single()

        if (!existingMember) {
          // Admin is not a member, add them as owner
          const { error: memberError } = await (supabase as any)
            .from('org_members')
            .insert({
              org_id: existingAdminOrg.id,
              user_id: userId,
              role: 'owner'
            })

          if (memberError) {
            console.error('Error adding admin to existing organization:', memberError)
          }
        }
        return // Organization already exists
      }

      // Organization doesn't exist, create it
      console.log('Creating admin organization...')
      
      // Create admin organization
      const { data: newOrg, error: orgError } = await (supabase as any)
        .from('organizations')
        .insert({
          name: 'Admin Organization',
          plan: 'enterprise'
        })
        .select()
        .single()

      if (orgError || !newOrg) {
        console.error('Error creating admin organization:', orgError)
        return
      }

      // Add admin as owner of the organization
      const { error: memberError } = await (supabase as any)
        .from('org_members')
        .insert({
          org_id: newOrg.id,
          user_id: userId,
          role: 'owner'
        })

      if (memberError) {
        console.error('Error adding admin to organization:', memberError)
      }

      // Create a subscription for the admin organization
      await (supabase as any)
        .from('subscriptions')
        .insert({
          org_id: newOrg.id,
          stripe_customer_id: 'admin-' + newOrg.id,
          stripe_subscription_id: 'admin-sub-' + newOrg.id,
          plan: 'enterprise',
          status: 'active'
        })

    } catch (error) {
      console.error('Error ensuring admin organization:', error)
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        console.error('Auth error in dashboard layout:', userError)
        router.push('/auth/signin')
        return
      }
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || user.email?.split('@')[0],
        avatar_url: user.user_metadata?.avatar_url,
        created_at: user.created_at,
      })

      // Check if user is admin (sh4m4ni4k@sh4m4ni4k.nl)
      const isAdminUser = user.email === 'sh4m4ni4k@sh4m4ni4k.nl'
      setIsAdmin(isAdminUser)

      // Always ensure user is in admin organization (for both admin and regular users)
      try {
        await fetch('/api/auto-join-admin-org', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id }),
        })
      } catch (orgError) {
        console.error('Error ensuring admin org membership:', orgError)
      }

      if (isAdminUser) {
        // Ensure admin has an organization
        await ensureAdminOrganization(user.id)

        // For admin: fetch all active organizations
        const { data: orgs, error: orgError } = await (supabase as any)
          .from('organizations')
          .select(`
            *,
            subscriptions!inner(status)
          `)
          .eq('subscriptions.status', 'active')
          .order('created_at', { ascending: false })

        console.log('Admin organizations query result:', { orgs, orgError })

        if (orgs) {
          setOrganizations(orgs)
        }

        // For admin: fetch all active clients
        const { data: clientsData, error: clientsError } = await (supabase as any)
          .from('clients')
          .select(`
            *,
            organizations(name, plan)
          `)
          .order('created_at', { ascending: false })

        if (clientsData) {
          setClients(clientsData)
        }
      } else {
        // For regular users: check if they have an organization, create one if not
        const { data: orgs, error } = await (supabase as any)
          .from('org_members')
          .select('org_id, role, created_at')
          .eq('user_id', user.id)

        if (orgs && orgs.length > 0) {
          // Fetch organization details for each org_id
          const orgIds = orgs.map((org: any) => org.org_id)
          const { data: orgDetails } = await (supabase as any)
            .from('organizations')
            .select('*')
            .in('id', orgIds)
          
          if (orgDetails) {
            setOrganizations(orgDetails)
          }
        } else {
          // User doesn't have an organization yet - try to create one manually
          console.log('No organization found for user. Attempting to create organization manually.')
          
          try {
            // Create organization manually as fallback
            const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'User'
            const { data: newOrg, error: orgError } = await (supabase as any)
              .from('organizations')
              .insert({
                name: userName + "'s Organization",
                plan: 'basic'
              })
              .select()
              .single()

            if (newOrg && !orgError) {
              // Add user as owner
              const { error: memberError } = await (supabase as any)
                .from('org_members')
                .insert({
                  org_id: newOrg.id,
                  user_id: user.id,
                  role: 'owner'
                })

              if (!memberError) {
                // Create subscription
                await (supabase as any)
                  .from('subscriptions')
                  .insert({
                    org_id: newOrg.id,
                    stripe_customer_id: 'temp-customer-' + newOrg.id,
                    stripe_subscription_id: 'temp-sub-' + newOrg.id,
                    plan: 'basic',
                    status: 'active'
                  })

                // Create default client
                await (supabase as any)
                  .from('clients')
                  .insert({
                    org_id: newOrg.id,
                    name: userName + "'s Client",
                    contact_info: { email: user.email }
                  })

                console.log('Successfully created organization manually:', newOrg)
                setOrganizations([newOrg])
              }
            }
          } catch (error) {
            console.error('Failed to create organization manually:', error)
            // Try to fetch again after a delay in case the trigger eventually works
            setTimeout(async () => {
              const { data: retryOrgs } = await (supabase as any)
                .from('org_members')
                .select('org_id, role, created_at')
                .eq('user_id', user.id)

              if (retryOrgs && retryOrgs.length > 0) {
                const orgIds = retryOrgs.map((org: any) => org.org_id)
                const { data: orgDetails } = await (supabase as any)
                  .from('organizations')
                  .select('*')
                  .in('id', orgIds)
                
                if (orgDetails) {
                  setOrganizations(orgDetails)
                }
              }
            }, 3000)
          }
        }
      }

      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/auth/signin')
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleEditOrgName = (org: Organization) => {
    setEditingOrg(org)
    setNewOrgName(org.name)
    setEditOrgModal(true)
  }

  const handleSaveOrgName = async () => {
    if (!editingOrg || !newOrgName.trim()) return

    try {
      const { error } = await (supabase as any)
        .from('organizations')
        .update({ 
          name: newOrgName.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingOrg.id)

      if (error) {
        toast.error('Failed to update organization name')
        console.error('Error updating organization:', error)
      } else {
        // Update local state
        setOrganizations(prev => 
          prev.map(org => 
            org.id === editingOrg.id 
              ? { ...org, name: newOrgName.trim(), updated_at: new Date().toISOString() }
              : org
          )
        )
        toast.success('Organization name updated successfully')
        setEditOrgModal(false)
        setEditingOrg(null)
        setNewOrgName('')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error('Unexpected error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

    return (
      <div className="min-h-screen bg-black">
        {/* Header */}
        <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <Logo size="md" showText={false} />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Timeline Alchemy</span>
              </Link>
            </div>


            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-300">
                {user?.name || user?.email}
                {isAdmin && (
                  <span className="ml-2 px-2 py-1 text-xs bg-yellow-600 text-yellow-100 rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

        {/* Sidebar */}
        <div className="flex">
          <aside className="w-64 bg-gray-900 shadow-sm min-h-screen border-r border-gray-800">
          <div className="p-6">
            {/* Navigation Links */}
            <nav className="mb-8">
              <div className="space-y-2">
                <Link href="/dashboard" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="mr-3">📊</span>
                  Dashboard
                </Link>
                <Link href="/dashboard/content" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="mr-3">📝</span>
                  Content
                </Link>
                <Link href="/dashboard/content/list" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="mr-3">📦</span>
                  Packages
                </Link>
                <Link href="/dashboard/leaderboard" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="mr-3">🏆</span>
                  Leaderboard
                </Link>
                <Link href="/dashboard/schedule" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="mr-3">📅</span>
                  Schedule
                </Link>
                <Link href="/dashboard/socials" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="mr-3">🔗</span>
                  Socials
                </Link>
                <Link href="/dashboard/billing" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                  <span className="mr-3">💳</span>
                  Billing
                </Link>
                {isAdmin && (
                  <>
                    <div className="border-t border-gray-700 my-4"></div>
                    <Link href="/dashboard/organizations" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="mr-3">🏢</span>
                      Organizations
                    </Link>
                    <Link href="/dashboard/subscriptions" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="mr-3">📋</span>
                      Subscriptions
                    </Link>
                    <Link href="/dashboard/admin/clients" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="mr-3">👥</span>
                      Manage Clients
                    </Link>
                    <Link href="/dashboard/admin/packages" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="mr-3">📦</span>
                      Admin Packages
                    </Link>
                    <Link href="/dashboard/admin/migrate" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="mr-3">🔧</span>
                      Migrate DB
                    </Link>
                    <Link href="/dashboard/admin/debug" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="mr-3">🐛</span>
                      Debug
                    </Link>
                    <Link href="/dashboard/analytics" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="mr-3">📈</span>
                      Analytics
                    </Link>
                    <Link href="/dashboard/debug-packages" className="flex items-center px-3 py-2 text-gray-200 hover:text-yellow-400 hover:bg-gray-800 rounded-lg transition-colors">
                      <span className="mr-3">🔍</span>
                      Debug Packages
                    </Link>
                  </>
                )}
              </div>
            </nav>

              {/* Organization Info */}
              {organizations.length > 0 && (
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    {isAdmin ? 'Active Organizations' : 'My Organization'}
                  </h3>
                  <div className="space-y-2">
                    {organizations.map((org) => (
                      <div
                        key={org.id}
                        className="p-3 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-white">{org.name}</div>
                            <div className="text-sm text-gray-300 capitalize">{org.plan}</div>
                            {isAdmin && (
                              <div className="text-xs text-green-400">Active</div>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditOrgName(org)
                            }}
                            className="ml-2 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
                          >
                            Edit
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>

      {/* Edit Organization Modal */}
      <Modal
        isOpen={editOrgModal}
        onClose={() => {
          setEditOrgModal(false)
          setEditingOrg(null)
          setNewOrgName('')
        }}
        title="Edit Organization Name"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="orgName" className="text-white">Organization Name</Label>
            <Input
              id="orgName"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="mt-1 bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-yellow-400"
              autoFocus
            />
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditOrgModal(false)
                setEditingOrg(null)
                setNewOrgName('')
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveOrgName}
              disabled={!newOrgName.trim() || newOrgName.trim() === editingOrg?.name}
              className="bg-yellow-400 text-black hover:bg-yellow-500 disabled:bg-gray-600 disabled:text-gray-400"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
