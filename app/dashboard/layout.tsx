'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Organization } from '@/types/index'
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
  const [loading, setLoading] = useState(true)
  const router = useRouter()

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

      // Fetch user's organizations
      const { data: orgs, error } = await supabase
        .from('org_members')
        .select(`
          *,
          organizations (*)
        `)
        .eq('user_id', user.id)

      if (orgs) {
        setOrganizations(orgs.map((org: any) => org.organizations))
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <Logo size="md" showText={false} />
              </Link>
            </div>

            <nav className="hidden md:flex space-x-8">
              <Link href="/dashboard" className="text-gray-700 hover:text-primary">
                Dashboard
              </Link>
              <Link href="/dashboard/content" className="text-gray-700 hover:text-primary">
                Content
              </Link>
              <Link href="/dashboard/schedule" className="text-gray-700 hover:text-primary">
                Schedule
              </Link>
              <Link href="/dashboard/socials" className="text-gray-700 hover:text-primary">
                Socials
              </Link>
              <Link href="/dashboard/billing" className="text-gray-700 hover:text-primary">
                Billing
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-700">
                {user?.name || user?.email}
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
        <aside className="w-64 bg-white shadow-sm min-h-screen">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Organizations</h3>
            <div className="space-y-2">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="font-medium text-gray-900">{org.name}</div>
                  <div className="text-sm text-gray-500 capitalize">{org.plan}</div>
                </div>
              ))}
            </div>
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
