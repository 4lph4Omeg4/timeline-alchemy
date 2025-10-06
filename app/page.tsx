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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Divine Background Effects - MUCH DARKER */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/10 to-black"></div>
      <div className="absolute inset-0 bg-gradient-to-r from-purple-600/3 via-purple-500/5 to-purple-600/3 animate-pulse"></div>
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.02),transparent_80%)]"></div>
      
      {/* Floating Orbs */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-500/25 to-purple-400/30 rounded-full blur-xl animate-bounce"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400/20 to-pink-400/25 rounded-full blur-xl animate-bounce delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/20 to-purple-600/25 rounded-full blur-xl animate-bounce delay-2000"></div>

      {/* Header */}
      <header className="bg-black/98 backdrop-blur-md shadow-2xl border-b border-purple-500/20 relative z-10">
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
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-6 leading-tight">
              Create content with{' '}
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
          
          {/* Promo Video */}
          <div className="mb-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-purple-500/30 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-md">
              <video 
                className="w-full h-auto"
                controls
                poster=""
                preload="metadata"
              >
                <source 
                  src="https://kjjrzhicspmbiitayrco.supabase.co/storage/v1/object/public/video/e6c0db74-03ee-4bb3-b08d-d94512efab91/video-promo-portfolio/timeline-alchemy%20(1).mp4" 
                  type="video/mp4" 
                />
                Your browser does not support the video tag.
              </video>
              {/* Divine Glow Effect */}
              <div className="absolute -inset-4 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-2xl -z-10"></div>
            </div>
          </div>
          
          {/* Divine CTA */}
          <div className="flex justify-center space-x-6 mb-16">
            <Button 
              size="lg" 
              onClick={handleSignUp} 
              className="text-xl px-12 py-6 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 border border-purple-400/50"
            >
              🌟 Begin Divine Journey 🌟
            </Button>
            <Button 
              size="lg" 
              onClick={() => router.push('/portfolio')} 
              className="text-xl px-12 py-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 hover:from-blue-500 hover:via-purple-500 hover:to-blue-500 text-white font-bold shadow-2xl hover:shadow-blue-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-2 border border-blue-400/50"
            >
              🌟 View Content Previews 🌟
            </Button>
          </div>
          
          {/* Divine Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-purple-800/30 to-pink-800/30 backdrop-blur-md rounded-2xl p-6 border border-purple-500/30 shadow-xl">
              <div className="text-3xl font-bold text-yellow-300 mb-2">1000+</div>
              <div className="text-purple-200">content packages created</div>
            </div>
            <div className="bg-gradient-to-br from-blue-800/30 to-purple-800/30 backdrop-blur-md rounded-2xl p-6 border border-blue-500/30 shadow-xl">
              <div className="text-3xl font-bold text-yellow-300 mb-2">1+</div>
              <div className="text-blue-200">At least one enlightened creator</div>
            </div>
            <div className="bg-gradient-to-br from-pink-800/30 to-yellow-800/30 backdrop-blur-md rounded-2xl p-6 border border-pink-500/30 shadow-xl">
              <div className="text-3xl font-bold text-yellow-300 mb-2">99.9%</div>
              <div className="text-pink-200">divine satisfaction rate</div>
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
                <span className="text-pink-300 font-semibold">Twitter, LinkedIn, Instagram, Facebook, and YouTube </span> 
                with a single divine click.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Divine Pricing */}
        <div className="text-center mb-20">
          <div className="relative mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 mb-4">
              Pricing Plans
            </h2>
            <p className="text-xl text-gray-200 font-light">
              Choose your path to content creation enlightenment
            </p>
            {/* Divine Glow */}
            <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-r from-yellow-600/20 via-yellow-500/20 to-yellow-600/20 rounded-3xl blur-2xl"></div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {/* Basic Plan */}
            <Card className="bg-gradient-to-br from-slate-800/50 to-gray-800/50 backdrop-blur-md border-slate-500/30 shadow-xl hover:shadow-slate-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <CardHeader className="pb-6">
                <CardTitle className="text-white text-xl font-bold group-hover:text-slate-200 transition-colors duration-300">
                  🌟 Basic
                </CardTitle>
                <div className="text-3xl font-black text-yellow-400 mb-2">€49<span className="text-sm text-gray-300 font-normal">/month</span></div>
                <p className="text-gray-300 text-sm">Perfect for beginners</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left text-gray-200 text-sm">
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>4 content packages</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Basic scheduling</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Standard support</li>
                </ul>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-slate-600 to-gray-600 hover:from-slate-500 hover:to-gray-500"
                  onClick={handleSignUp}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Initiate Plan */}
            <Card className="bg-gradient-to-br from-blue-800/50 to-purple-800/50 backdrop-blur-md border-blue-500/30 shadow-xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <CardHeader className="pb-6">
                <CardTitle className="text-white text-xl font-bold group-hover:text-blue-200 transition-colors duration-300">
                  🧠 Initiate
                </CardTitle>
                <div className="text-3xl font-black text-yellow-400 mb-2">€99<span className="text-sm text-gray-300 font-normal">/month</span></div>
                <p className="text-blue-200 text-sm">For growing creators</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left text-gray-200 text-sm">
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>8 content packages</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>10 custom content generations</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Advanced scheduling</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Priority support</li>
                </ul>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
                  onClick={handleSignUp}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Transcendant Plan - Featured */}
            <Card className="bg-gradient-to-br from-purple-800/60 to-pink-800/60 backdrop-blur-md border-purple-400/50 shadow-2xl hover:shadow-purple-500/50 transition-all duration-500 transform hover:scale-110 hover:-translate-y-3 group relative">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-xs font-bold">
                Most Popular
              </div>
              <CardHeader className="pb-6 pt-8">
                <CardTitle className="text-white text-xl font-bold group-hover:text-purple-200 transition-colors duration-300">
                  ⚡ Transcendant
                </CardTitle>
                <div className="text-3xl font-black text-yellow-400 mb-2">€199<span className="text-sm text-gray-300 font-normal">/month</span></div>
                <p className="text-purple-200 text-sm">For serious creators</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left text-gray-200 text-sm">
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>12 content packages</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Unlimited custom content</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Advanced analytics</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Priority support</li>
                </ul>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                  onClick={handleSignUp}
                >
                  Get Started
                </Button>
              </CardContent>
            </Card>

            {/* Universal Plan */}
            <Card className="bg-gradient-to-br from-yellow-800/50 to-orange-800/50 backdrop-blur-md border-yellow-500/30 shadow-xl hover:shadow-yellow-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <CardHeader className="pb-6">
                <CardTitle className="text-white text-xl font-bold group-hover:text-yellow-200 transition-colors duration-300">
                  🌍 Universal
                </CardTitle>
                <div className="text-3xl font-black text-yellow-400 mb-2">€499<span className="text-sm text-gray-300 font-normal">/month</span></div>
                <p className="text-yellow-200 text-sm">For enterprises</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-left text-gray-200 text-sm">
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Unlimited content packages</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Unlimited custom content</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Unlimited bulk generation</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>Custom integrations</li>
                  <li className="flex items-center"><span className="text-green-400 mr-2">✨</span>White-label options</li>
                </ul>
                <Button 
                  className="w-full mt-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500"
                  onClick={handleSignUp}
                >
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Platform Logos Section */}
        <div className="text-center mb-20">
          <div className="relative mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 mb-4">
              Trusted by Creators Across All Platforms
            </h3>
            <p className="text-lg text-gray-300 font-light">
              Seamlessly publish to your favorite social media platforms
            </p>
            {/* Divine Glow */}
            <div className="absolute -top-4 -left-4 -right-4 -bottom-4 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-blue-600/10 rounded-3xl blur-2xl"></div>
          </div>
          
          {/* Platform Logos Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 max-w-6xl mx-auto">
            {/* Twitter/X */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-900/20 to-blue-800/20 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-blue-400/50 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm group-hover:text-blue-200 transition-colors duration-300">X (Twitter)</span>
            </div>

            {/* LinkedIn */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-900/20 to-indigo-800/20 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-blue-400/50 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm group-hover:text-blue-200 transition-colors duration-300">LinkedIn</span>
            </div>

            {/* Instagram */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-pink-900/20 to-purple-800/20 backdrop-blur-md rounded-2xl border border-pink-500/20 shadow-xl hover:shadow-pink-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-pink-400/50 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm group-hover:text-pink-200 transition-colors duration-300">Instagram</span>
            </div>

            {/* Facebook */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-900/20 to-blue-700/20 backdrop-blur-md rounded-2xl border border-blue-500/20 shadow-xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-blue-400/50 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm group-hover:text-blue-200 transition-colors duration-300">Facebook</span>
            </div>

            {/* YouTube */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-md rounded-2xl border border-red-500/20 shadow-xl hover:shadow-red-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-red-400/50 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm group-hover:text-red-200 transition-colors duration-300">YouTube</span>
            </div>

            {/* TikTok */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900/20 to-black/20 backdrop-blur-md rounded-2xl border border-gray-500/20 shadow-xl hover:shadow-gray-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 group">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-2xl flex items-center justify-center mb-3 shadow-lg group-hover:shadow-gray-400/50 transition-all duration-300">
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </div>
              <span className="text-white font-semibold text-sm group-hover:text-gray-200 transition-colors duration-300">TikTok</span>
            </div>
          </div>
        </div>
      </main>

      {/* Divine Footer */}
      <footer className="bg-black text-gray-200 py-16 mt-20 border-t border-purple-500/20 relative overflow-hidden">
        {/* Divine Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/5 via-purple-500/8 to-purple-600/5"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-3 gap-8 items-start mb-8">
            {/* Left side - Company Info */}
            <div>
              <div className="flex items-center mb-4">
                <Logo size="sm" showText={false} />
                <span className="ml-2 text-white font-bold">Timeline Alchemy</span>
              </div>
              <p className="text-gray-400 text-sm">
                Transforming content creation with AI-powered magic for businesses and creators.
              </p>
            </div>

            {/* Middle - SH4M4NI4K.NL Links */}
            <div className="text-center">
              <h3 className="text-white font-semibold mb-4">SH4M4NI4K.NL</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="https://sh4m4ni4k.nl" className="text-gray-400 hover:text-yellow-400 transition" target="_blank" rel="noopener noreferrer">Cosmic Unity</a></li>
                <li><a href="https://timeline-alchemy.nl" className="text-gray-400 hover:text-yellow-400 transition" target="_blank" rel="noopener noreferrer">Timeline Alchemy</a></li>
              </ul>
            </div>

            {/* Right side - Contact */}
            <div className="text-right">
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