'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import Head from 'next/head'

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
    <div className="min-h-screen bg-gradient-to-br from-black to-gray-900">
      {/* Header */}
      <header className="bg-gray-900 shadow-sm border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Logo size="md" showText={false} />
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
          <h1 className="text-5xl font-bold text-white mb-6">
            Create Amazing Content with{' '}
            <span className="text-yellow-400">AI Magic</span>
          </h1>
          <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
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
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Logo size="sm" showText={false} />
                <span className="ml-2">AI Content Generation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200">
                Generate engaging blog posts and social media content using advanced AI. 
                Choose your tone, length, and platform-specific formatting.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Logo size="sm" showText={false} />
                <span className="ml-2">Smart Scheduling</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200">
                Schedule your content across multiple platforms with our intelligent 
                calendar system. Never miss an opportunity to engage your audience.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center text-white">
                <Logo size="sm" showText={false} />
                <span className="ml-2">Multi-Platform Publishing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200">
                Connect your social media accounts and publish content automatically 
                to Twitter, LinkedIn, Instagram, Facebook, and YouTube.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Preview */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-8">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Basic</CardTitle>
                <div className="text-3xl font-bold text-yellow-400">$129<span className="text-lg text-gray-300">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left text-gray-200">
                  <li>✓ 1 organization</li>
                  <li>✓ 4x Blog + crossplatform social links (set per week)</li>
                  <li>✓ Basic scheduling</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-yellow-400 border-2 bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Pro</CardTitle>
                <div className="text-3xl font-bold text-yellow-400">$249<span className="text-lg text-gray-300">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left text-gray-200">
                  <li>✓ 1 organization</li>
                  <li>✓ 8x Blog + crossplatform social links (2x set per week)</li>
                  <li>✓ Advanced scheduling</li>
                  <li>✓ Analytics dashboard</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Enterprise</CardTitle>
                <div className="text-3xl font-bold text-yellow-400">$499<span className="text-lg text-gray-300">/month</span></div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left text-gray-200">
                  <li>✓ Unlimited AI posts</li>
                  <li>✓ Priority support</li>
                  <li>✓ Custom integrations</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black text-gray-200 py-12 mt-16 border-t border-gray-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center mb-4">
                <Logo size="sm" showText={false} />
                <span className="ml-2 text-white font-bold">Timeline Alchemy</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transforming content creation with AI-powered magic for businesses and creators.
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="text-gray-400 hover:text-yellow-400 transition">Features</a></li>
                <li><a href="#pricing" className="text-gray-400 hover:text-yellow-400 transition">Pricing</a></li>
                <li><a href="/dashboard" className="text-gray-400 hover:text-yellow-400 transition">Dashboard</a></li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="/privacy-policy" className="text-gray-400 hover:text-yellow-400 transition">Privacy Policy</a></li>
                <li><a href="/terms-of-service" className="text-gray-400 hover:text-yellow-400 transition">Terms of Service</a></li>
                <li><a href="/cookie-policy" className="text-gray-400 hover:text-yellow-400 transition">Cookie Policy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:timeline-alchemy@sh4m4ni4k.nl" className="text-gray-400 hover:text-yellow-400 transition">timeline-alchemy@sh4m4ni4k.nl</a></li>
                <li><span className="text-gray-400">Poststraat 47B, 6371VL, Landgraaf, Netherlands</span></li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Timeline Alchemy. All rights reserved. 
              <span className="mx-2">|</span>
              <a href="/privacy-policy" className="hover:text-yellow-400 transition">Privacy</a>
              <span className="mx-2">|</span>
              <a href="/terms-of-service" className="hover:text-yellow-400 transition">Terms</a>
              <span className="mx-2">|</span>
              <a href="/cookie-policy" className="hover:text-yellow-400 transition">Cookies</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
