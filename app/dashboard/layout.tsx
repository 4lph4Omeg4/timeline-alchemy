'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Organization, Client } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const ensureAdminOrganization = async (userId: string) => {
    try {
      // Check if admin already has an organization
      const { data: existingOrg, error: checkError } = await supabase
        .from('org_members')
        .select('org_id, organizations(*)')
        .eq('user_id', userId)
        .eq('role', 'owner')
        .single()

      if (existingOrg) {
        console.log('Admin already has organization:', existingOrg.organizations)
        return // Admin already has an organization
      }

      // Only create if no organization exists
      console.log('Creating admin organization...')
      
      // Create admin organization
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Timeline Alchemy Admin',
          plan: 'enterprise'
        })
        .select()
        .single()

      if (orgError) {
        console.error('Error creating admin organization:', orgError)
        return
      }

      // Add admin as owner of the organization
      const { error: memberError } = await supabase
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
      await supabase
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
      const { data: { user } } = await supabase.auth.getUser()
      
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

      if (isAdminUser) {
        // Ensure admin has an organization
        await ensureAdminOrganization(user.id)

        // For admin: fetch all active organizations
        const { data: orgs, error: orgError } = await supabase
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
        const { data: clientsData, error: clientsError } = await supabase
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
        const { data: orgs, error } = await supabase
          .from('org_members')
          .select(`
            *,
            organizations (*)
          `)
          .eq('user_id', user.id)

        if (orgs && orgs.length > 0) {
          setOrganizations(orgs.map((org: any) => org.organizations))
        } else {
          // User doesn't have an organization yet - the database trigger should have created one
          // Let's wait a moment and try again, or show a message
          console.log('No organization found for user. This might be a new user - organization should be created automatically.')
          
          // Try to fetch again after a short delay
          setTimeout(async () => {
            const { data: retryOrgs, error: retryError } = await supabase
              .from('org_members')
              .select(`
                *,
                organizations (*)
              `)
              .eq('user_id', user.id)

            if (retryOrgs && retryOrgs.length > 0) {
              setOrganizations(retryOrgs.map((org: any) => org.organizations))
            }
          }, 2000)
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 shadow-sm border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <Logo size="md" showText={false} />
                <span className="ml-3 text-xl font-bold text-gray-900 dark:text-white">Timeline Alchemy</span>
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-300 hover:text-yellow-400">
                Dashboard
              </Link>
              <Link href="/dashboard/content" className="text-gray-300 hover:text-yellow-400">
                Content
              </Link>
              <Link href="/dashboard/schedule" className="text-gray-300 hover:text-yellow-400">
                Schedule
              </Link>
              <Link href="/dashboard/socials" className="text-gray-300 hover:text-yellow-400">
                Socials
              </Link>
              <Link href="/dashboard/billing" className="text-gray-300 hover:text-yellow-400">
                Billing
              </Link>
            </nav>

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
        <aside className="w-64 bg-gray-800 shadow-sm min-h-screen border-r border-gray-700">
          <div className="p-6">
            {isAdmin ? (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">Active Organizations</h3>
                <div className="space-y-2 mb-6">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer"
                    >
                      <div className="font-medium text-white">{org.name}</div>
                      <div className="text-sm text-gray-400 capitalize">{org.plan}</div>
                      <div className="text-xs text-green-400">Active</div>
                    </div>
                  ))}
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-4">Active Clients</h3>
                <div className="space-y-2">
                  {clients.map((client) => (
                    <div
                      key={client.id}
                      className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer"
                    >
                      <div className="font-medium text-white">{client.name}</div>
                      <div className="text-sm text-gray-400">
                        {client.contact_info?.email || 'No email'}
                      </div>
                      <div className="text-xs text-blue-400">
                        {client.organizations?.name || 'Unknown Org'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-white mb-4">My Organizations</h3>
                <div className="space-y-2">
                  {organizations.map((org) => (
                    <div
                      key={org.id}
                      className="p-3 rounded-lg bg-gray-700 hover:bg-gray-600 cursor-pointer"
                    >
                      <div className="font-medium text-white">{org.name}</div>
                      <div className="text-sm text-gray-400 capitalize">{org.plan}</div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
