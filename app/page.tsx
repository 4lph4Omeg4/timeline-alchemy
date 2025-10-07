'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/Logo'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setUser({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.name || user.email?.split('@')[0],
            avatar_url: user.user_metadata?.avatar_url,
            created_at: user.created_at,
          })
        }
      } catch (error) {
        console.error('Error getting user:', error)
      } finally {
        setLoading(false)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0],
            avatar_url: session.user.user_metadata?.avatar_url,
            created_at: session.user.created_at,
          })
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = () => {
    router.push('/auth/signin')
  }

  const handleSignUp = () => {
    router.push('/auth/signup')
  }

  const handleDashboard = () => {
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <Logo size="xl" showText={false} />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xl text-gray-200 mb-8">
              Ready to create amazing content with AI?
            </p>
            <Button onClick={handleDashboard} size="lg" className="text-lg px-8 py-3">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-white text-center">Timeline Alchemy</h1>
        <div className="mt-8 flex justify-center gap-4">
          <Button onClick={handleSignIn}>Sign In</Button>
          <Button onClick={handleSignUp}>Get Started</Button>
        </div>
      </div>
    </div>
  )
}
