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
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-900 to-black relative overflow-hidden">
      {/* Divine Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/15 via-purple-500/20 to-purple-600/15 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.08),transparent_60%)]"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-blue-400/30 to-purple-400/30 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-pink-400/30 to-yellow-400/30 rounded-full blur-xl animate-bounce delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-green-400/30 to-blue-400/30 rounded-full blur-xl animate-bounce delay-2000"></div>

      {/* Header */}
      <header className="bg-gradient-to-r from-slate-800/90 via-purple-800/90 to-slate-800/90 backdrop-blur-md shadow-2xl border-b border-purple-500/30 relative z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <Logo size="md" showText={false} />
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={handleSignIn}
                className="bg-transparent border-purple-400/50 text-purple-200 hover:bg-purple-400/20 hover:border-purple-300 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
              >
                Sign In
              </Button>
              <Button 
                onClick={handleSignUp}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-20 relative z-10">
        <div className="text-center mb-20">
          {/* Divine Title */}
          <div className="relative mb-8">
            <h1 className="text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-6 leading-tight">
              Create Divine Content with{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-pulse">
                ✨ AI Magic ✨
              </span>
            </h1>
            {/* Divine Glow Effect */}
            <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-2xl animate-pulse"></div>
          </div>
          
          {/* Heavenly Subtitle */}
          <p className="text-2xl md:text-3xl text-gray-100 mb-12 max-w-4xl mx-auto leading-relaxed font-light">
            Timeline Alchemy transforms your creative vision into{' '}
            <span className="text-purple-300 font-semibold">heavenly content</span> that captivates audiences across{' '}
            <span className="text-pink-300 font-semibold">all social media realms</span>
          </p>
          
          {/* Divine CTA */}
          <div className="flex justify-center space-x-6 mb-16">
            <Button 
              size="lg" 
              onClick={handleSignUp} 
              className="text-xl px-12 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 border border-purple-400/50"
            >
              🌟 Begin Divine Journey 🌟
            </Button>
          </div>
          
          {/* Divine Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
              <div className="text-3xl font-bold text-yellow-300 mb-2">10,000+</div>
              <div className="text-purple-200">Divine Content Pieces Created</div>
            </div>
            <div className="bg-gradient-to-br from-blue-800/30 to-purple-800/30 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30 shadow-xl">
              <div className="text-3xl font-bold text-yellow-300 mb-2">500+</div>
              <div className="text-blue-200">Enlightened Creators</div>
            </div>
            <div className="bg-gradient-to-br from-pink-800/30 to-yellow-800/30 backdrop-blur-md rounded-2xl p-6 border border-pink-500/30 shadow-xl">
              <div className="text-3xl font-bold text-yellow-300 mb-2">99.9%</div>
              <div className="text-pink-200">Divine Satisfaction Rate</div>
            </div>
          </div>
        </div>

        {/* Divine Features Grid */}
        <div className="grid md:grid-cols-3 gap-10 mb-20">
          {/* AI Content Generation */}
          <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-md border-purple-500/30 shadow-2xl hover:shadow-purple-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-white text-xl font-bold group-hover:text-purple-200 transition-colors duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-2xl">✨</span>
                </div>
                Divine AI Generation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200 text-lg leading-relaxed">
                Channel the power of advanced AI to create{' '}
                <span className="text-purple-300 font-semibold">heavenly content</span> that resonates with your audience. 
                Choose your divine tone, celestial length, and platform-specific formatting.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Smart Scheduling */}
          <Card className="bg-gradient-to-br from-blue-900/40 to-green-900/40 backdrop-blur-md border-blue-500/30 shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-white text-xl font-bold group-hover:text-blue-200 transition-colors duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-2xl">📅</span>
                </div>
                Celestial Scheduling
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200 text-lg leading-relaxed">
                Orchestrate your content across multiple platforms with our{' '}
                <span className="text-blue-300 font-semibold">intelligent cosmic calendar</span>. 
                Never miss a divine opportunity to connect with your enlightened audience.
              </CardDescription>
            </CardContent>
          </Card>

          {/* Multi-Platform Publishing */}
          <Card className="bg-gradient-to-br from-pink-900/40 to-yellow-900/40 backdrop-blur-md border-pink-500/30 shadow-2xl hover:shadow-pink-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center text-white text-xl font-bold group-hover:text-pink-200 transition-colors duration-300">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-yellow-500 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                  <span className="text-2xl">🚀</span>
                </div>
                Universal Publishing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-gray-200 text-lg leading-relaxed">
                Connect your social media realms and publish content directly to{' '}
                <span className="text-pink-300 font-semibold">Twitter, LinkedIn, Instagram, Facebook, and YouTube</span> 
                with a single divine click.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Divine Pricing */}
        <div className="text-center mb-20">
          <div className="relative mb-12">
            <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 mb-4">
              Divine Pricing Plans
            </h2>
            <p className="text-xl text-gray-200 font-light">
              Choose your path to content creation enlightenment
            </p>
            {/* Divine Glow */}
            <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-r from-yellow-600/20 via-yellow-500/20 to-yellow-600/20 rounded-3xl blur-2xl"></div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Basic Plan */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-md border-slate-500/30 shadow-xl hover:shadow-slate-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <CardHeader className="pb-6">
                <CardTitle className="text-white text-2xl font-bold group-hover:text-slate-200 transition-colors duration-300">
                  🌟 Divine Basic
                </CardTitle>
                <div className="text-4xl font-black text-yellow-400 mb-2">€129<span className="text-lg text-gray-300 font-normal">/month</span></div>
                <p className="text-gray-300 text-sm">Perfect for divine beginners</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-left text-gray-200">
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>1 divine organization</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>4x Heavenly Blog + cross-platform social links</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>Basic celestial scheduling</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>Divine content templates</li>
                </ul>
              </CardContent>
            </Card>

            {/* Pro Plan - Featured */}
            <Card className="bg-gradient-to-br from-purple-800/60 to-pink-800/60 backdrop-blur-md border-purple-400/50 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-3 group relative">
              {/* Popular Badge */}
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                  ⭐ MOST DIVINE ⭐
                </div>
              </div>
              <CardHeader className="pb-6 pt-8">
                <CardTitle className="text-white text-2xl font-bold group-hover:text-purple-200 transition-colors duration-300">
                  👑 Divine Pro
                </CardTitle>
                <div className="text-4xl font-black text-yellow-400 mb-2">€249<span className="text-lg text-gray-300 font-normal">/month</span></div>
                <p className="text-purple-200 text-sm">For enlightened creators</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-left text-gray-200">
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>1 divine organization</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>8x Heavenly Blog + cross-platform social links</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>Advanced celestial scheduling</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>Divine analytics dashboard</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>Priority divine support</li>
                </ul>
              </CardContent>
            </Card>

            {/* Enterprise Plan */}
            <Card className="bg-gradient-to-br from-blue-800/50 to-purple-800/50 backdrop-blur-md border-blue-500/30 shadow-xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <CardHeader className="pb-6">
                <CardTitle className="text-white text-2xl font-bold group-hover:text-blue-200 transition-colors duration-300">
                  🚀 Divine Enterprise
                </CardTitle>
                <div className="text-4xl font-black text-yellow-400 mb-2">€499<span className="text-lg text-gray-300 font-normal">/month</span></div>
                <p className="text-blue-200 text-sm">For cosmic-scale operations</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-left text-gray-200">
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>Unlimited divine AI posts</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>Priority cosmic support</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>Custom divine integrations</li>
                  <li className="flex items-center"><span className="text-green-400 mr-3">✨</span>White-label divine branding</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Divine Footer */}
      <footer className="bg-gradient-to-r from-slate-900 via-purple-900 to-slate-900 text-gray-200 py-16 mt-20 border-t border-purple-500/30 relative overflow-hidden">
        {/* Divine Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_30%_20%,rgba(120,119,198,0.1),transparent_50%)]"></div>
        
        <div className="container mx-auto px-4 relative z-10">
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

            {/* SH4M4NI4K.NL Links */}
            <div>
              <h3 className="text-white font-semibold mb-4">SH4M4NI4K.NL</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://sh4m4ni4k.nl" className="text-gray-400 hover:text-yellow-400 transition" target="_blank" rel="noopener noreferrer">Cosmic Unity</a></li>
                <li><a href="https://timeline-alchemy.nl" className="text-gray-400 hover:text-yellow-400 transition" target="_blank" rel="noopener noreferrer">Timeline Alchemy</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-white font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="mailto:timeline-alchemy@sh4m4ni4k.nl" className="text-gray-400 hover:text-yellow-400 transition">timeline-alchemy@sh4m4ni4k.nl</a></li>
                <li><span className="text-gray-400">Poststraat 47B, 6371VL</span></li>
                <li><span className="text-gray-400">Landgraaf, Netherlands</span></li>
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
