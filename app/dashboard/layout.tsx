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
        // Organization exists, check if user is already a member
        const { data: existingMember, error: memberCheckError } = await (supabase as any)
          .from('org_members')
          .select('id, role')
          .eq('user_id', userId)
          .eq('org_id', existingAdminOrg.id)
          .single()

        if (!existingMember) {
          // Check if this is the admin user
          const { data: { user } } = await supabase.auth.getUser()
          const isAdminUser = user?.email === 'sh4m4ni4k@sh4m4ni4k.nl'
          
          // User is not a member, add them (admin as owner, others as client)
          const { error: memberError } = await (supabase as any)
            .from('org_members')
            .insert({
              org_id: existingAdminOrg.id,
              user_id: userId,
              role: isAdminUser ? 'owner' : 'client'
            })

          if (memberError) {
            console.error('Error adding user to admin organization:', memberError)
          } else {
            console.log(`User added to admin organization as ${isAdminUser ? 'owner' : 'client'}`)
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
          plan: 'universal'
        })
        .select()
        .single()

      if (orgError || !newOrg) {
        console.error('Error creating admin organization:', orgError)
        return
      }

      // Check if this is the admin user
      const { data: { user } } = await supabase.auth.getUser()
      const isAdminUser = user?.email === 'sh4m4ni4k@sh4m4ni4k.nl'
      
      // Add user (admin as owner, others as client)
      const { error: memberError } = await (supabase as any)
        .from('org_members')
        .insert({
          org_id: newOrg.id,
          user_id: userId,
          role: isAdminUser ? 'owner' : 'client'
        })

      if (memberError) {
        console.error('Error adding user to organization:', memberError)
      }

      // Create a subscription for the admin organization
      await (supabase as any)
        .from('subscriptions')
        .insert({
          org_id: newOrg.id,
          stripe_customer_id: 'admin-' + newOrg.id,
          stripe_subscription_id: 'admin-sub-' + newOrg.id,
          plan: 'universal',
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

      // Ensure all users have access to admin organization for global packages
      await ensureAdminOrganization(user.id)

      if (isAdminUser) {

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
        // For regular users: fetch their organizations
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
          // No organizations found - this shouldn't happen with new signup flow
          // Redirect to create organization page as fallback
          console.error('No organizations found for user. This user may have signed up before the new flow.')
          router.push('/create-organization')
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
      <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
        {/* Cosmic Loading Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-purple-500/15 to-purple-600/10 animate-pulse"></div>
        
        <div className="relative z-10 flex flex-col items-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
          <p className="mt-4 text-purple-200 text-lg font-semibold">✨ Entering Dimension... ✨</p>
        </div>
      </div>
    )
  }

    return (
      <div className="min-h-screen bg-black relative overflow-hidden">
        {/* Cosmic Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/10 to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-purple-500/8 to-purple-600/5 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.03),transparent_70%)]"></div>
        
        {/* Floating Cosmic Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-500/15 to-purple-400/20 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400/10 to-pink-400/15 rounded-full blur-xl animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/10 to-purple-600/15 rounded-full blur-xl animate-bounce delay-2000"></div>

        {/* Cosmic Header */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              {/* Logo - Left */}
              <Link href="/dashboard" className="flex items-center">
                <Logo size="lg" showText={false} />
              </Link>

              {/* User Info & Buttons - Right */}
              <div className="flex items-center gap-4">
                <div className="text-sm text-purple-200">
                  <span className="font-semibold">{user?.name || user?.email}</span>
                  {isAdmin && (
                    <span className="ml-2 px-2 py-1 text-xs bg-gradient-to-r from-yellow-500 to-yellow-400 text-black rounded-full font-bold shadow-lg">
                      ✨ COSMIC ADMIN ✨
                    </span>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-purple-500/50 text-purple-200 hover:bg-gradient-to-r hover:from-purple-600/30 hover:to-pink-600/30 hover:border-purple-400 transition-all duration-300"
                >
                  Exit Dimension
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Cosmic Sidebar */}
        <div className="flex pt-24">
          <aside className="w-64 bg-gradient-to-b from-purple-900/30 to-blue-900/30 backdrop-blur-md shadow-2xl min-h-screen border-r border-purple-500/30 relative z-10">
            <div className="p-6">
              {/* Navigation Links */}
              <nav className="mb-8">
                <div className="space-y-2">
                  <Link href="/dashboard" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">✨</span>
                    <span className="font-semibold">Dashboard</span>
                  </Link>
                  <Link href="/dashboard/ai-gateway" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">🚀</span>
                    <span className="font-semibold">AI Gateway</span>
                  </Link>
                  <Link href="/dashboard/content" className="flex flex-col px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <div className="flex items-center">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">📝</span>
                    <span className="font-semibold">Content</span>
                    </div>
                    <span className="text-xs text-blue-300 ml-8 mt-1 bg-blue-500/20 px-2 py-0.5 rounded-full w-fit">Trial</span>
                  </Link>
                  <Link href="/dashboard/bulk-content" className="flex flex-col px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <div className="flex items-center">
                      <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">⚡</span>
                      <span className="font-semibold">Bulk Content</span>
                    </div>
                    <div className="flex gap-2 ml-8 mt-1">
                      <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full w-fit">Trial</span>
                      <span className="text-xs text-yellow-300 bg-yellow-500/20 px-2 py-0.5 rounded-full w-fit">Universal</span>
                    </div>
                  </Link>
                  <Link href="/dashboard/content/list" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">📦</span>
                    <span className="font-semibold">Packages</span>
                  </Link>
                  <Link href="/dashboard/leaderboard" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">🏆</span>
                    <span className="font-semibold">Leaderboard</span>
                  </Link>
                  <Link href="/dashboard/schedule" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">📅</span>
                    <span className="font-semibold">Schedule</span>
                  </Link>
                  <Link href="/dashboard/posting-status" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">🚀</span>
                    <span className="font-semibold">Posting Status</span>
                  </Link>
                  <Link href="/dashboard/socials" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">🔗</span>
                    <span className="font-semibold">Socials</span>
                  </Link>
                  <Link href="/dashboard/telegram-channels" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">📱</span>
                    <span className="font-semibold">Telegram</span>
                  </Link>
                  <Link href="/dashboard/token-status" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">🔑</span>
                    <span className="font-semibold">Token Status</span>
                  </Link>
                  <Link href="/dashboard/admin/branding" className="flex flex-col px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <div className="flex items-center">
                      <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">🎨</span>
                      <span className="font-semibold">Branding</span>
                    </div>
                    <span className="text-xs text-yellow-300 ml-8 mt-1 bg-yellow-500/20 px-2 py-0.5 rounded-full w-fit">Universal</span>
                  </Link>
                  <Link href="/dashboard/billing" className="flex flex-col px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                    <div className="flex items-center">
                    <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">💳</span>
                    <span className="font-semibold">Billing</span>
                    </div>
                    {/* Trial badge will be shown dynamically based on user's subscription status */}
                  </Link>
                  {isAdmin && (
                    <>
                      <div className="border-t border-purple-500/30 my-4"></div>
                      <div className="text-xs text-purple-300 font-bold uppercase tracking-wider mb-2 px-3">✨ Admin Realm ✨</div>
                      <Link href="/dashboard/organizations" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                        <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">🏢</span>
                        <span className="font-semibold">Organizations</span>
                      </Link>
                      <Link href="/dashboard/subscriptions" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                        <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">📋</span>
                        <span className="font-semibold">Subscriptions</span>
                      </Link>
                      <Link href="/dashboard/admin/clients" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                        <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">👥</span>
                        <span className="font-semibold">Manage Clients</span>
                      </Link>
                      <Link href="/dashboard/admin/packages" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                        <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">📦</span>
                        <span className="font-semibold">Admin Packages</span>
                      </Link>
                      <Link href="/dashboard/analytics" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                        <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">📈</span>
                        <span className="font-semibold">Analytics</span>
                      </Link>
                      <Link href="/dashboard/admin/watermark" className="flex items-center px-3 py-2 text-purple-200 hover:text-yellow-400 hover:bg-gradient-to-r hover:from-purple-800/30 hover:to-blue-800/30 rounded-lg transition-all duration-300 group">
                        <span className="mr-3 text-lg group-hover:scale-110 transition-transform duration-300">💧</span>
                        <span className="font-semibold">Bulk Watermark</span>
                      </Link>
                    </>
                  )}
                </div>
              </nav>

            </div>
          </aside>

          {/* Cosmic Main Content */}
          <main className="flex-1 p-6 relative z-10">
            <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-md rounded-2xl border border-purple-500/20 shadow-2xl min-h-full p-6">
              {children}
            </div>
          </main>
        </div>

      {/* Cosmic Edit Organization Modal */}
      <Modal
        isOpen={editOrgModal}
        onClose={() => {
          setEditOrgModal(false)
          setEditingOrg(null)
          setNewOrgName('')
        }}
        title="✨ Edit Organization Name ✨"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="orgName" className="text-purple-200 font-semibold">Organization Name</Label>
            <Input
              id="orgName"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="Enter organization name"
              className="mt-1 bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
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
              className="border-purple-500/50 text-purple-300 hover:bg-purple-800/30 hover:text-white hover:border-purple-400 transition-all duration-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveOrgName}
              disabled={!newOrgName.trim() || newOrgName.trim() === editingOrg?.name}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold disabled:bg-gray-600 disabled:text-gray-400 transition-all duration-300"
            >
              ✨ Save Changes ✨
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
