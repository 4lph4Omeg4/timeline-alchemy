'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SparklesIcon } from '@/components/icons/SparklesIcon'

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const getUser = async () => {
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
      setLoading(false)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="bg-primary rounded-full p-4">
                <SparklesIcon className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back, {user.name}!
            </h1>
            <p className="text-xl text-gray-600 mb-8">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <SparklesIcon className="h-8 w-8 text-primary" />
              <span className="text-2xl font-bold text-gray-900">Timeline Alchemy</span>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button onClick={handleSignUp}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Create Amazing Content with{' '}
            <span className="text-primary">AI Magic</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Timeline Alchemy helps small businesses and creators generate, schedule, 
            and publish AI-powered content across all social media platforms.
          </p>
          <div className="flex justify-center space-x-4">
            <Button size="lg" onClick={handleSignUp} className="text-lg px-8 py-3">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-primary mr-2" />
                AI Content Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Generate engaging blog posts and social media content using advanced AI. 
                Choose your tone, length, and platform-specific formatting.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-primary mr-2" />
                Smart Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Schedule your content across multiple platforms with our intelligent 
                calendar system. Never miss an opportunity to engage your audience.
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <SparklesIcon className="h-6 w-6 text-primary mr-2" />
                Multi-Platform Publishing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Connect your social media accounts and publish content automatically 
                to Twitter, LinkedIn, Instagram, Facebook, and YouTube.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Preview */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Basic</CardTitle>
                <div className="text-3xl font-bold text-primary">$29<span className="text-lg text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li>✓ 5 AI posts per month</li>
                  <li>✓ 1 organization</li>
                  <li>✓ 2 social accounts</li>
                  <li>✓ Basic scheduling</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary border-2">
              <CardHeader>
                <CardTitle>Pro</CardTitle>
                <div className="text-3xl font-bold text-primary">$99<span className="text-lg text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li>✓ 50 AI posts per month</li>
                  <li>✓ 3 organizations</li>
                  <li>✓ 10 social accounts</li>
                  <li>✓ Advanced scheduling</li>
                  <li>✓ Analytics dashboard</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="text-3xl font-bold text-primary">$299<span className="text-lg text-gray-500">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left">
                  <li>✓ Unlimited AI posts</li>
                  <li>✓ Unlimited organizations</li>
                  <li>✓ Unlimited social accounts</li>
                  <li>✓ Priority support</li>
                  <li>✓ Custom integrations</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; 2024 Timeline Alchemy. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
