'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User } from '@/types/index'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
    <div className="min-h-screen bg-black relative overflow-hidden">
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
            <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 mb-6 leading-tight">
              Create content with{' '}
              <span className="bg-gradient-to-r from-yellow-300 via-yellow-400 to-yellow-500 bg-clip-text text-transparent animate-pulse">
                ✨ AI Magic ✨
              </span>
            </h1>
          
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
            </div>
          </div>
          
          {/* CTA */}
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
        </div>

        {/* Pricing Plans Section */}
        <div className="text-center mb-20">
          <div className="relative mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-blue-300 mb-4">
              Choose Your Divine Path
            </h3>
            <p className="text-lg text-gray-300 font-light">
              Select the plan that aligns with your creative journey
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 max-w-8xl mx-auto">
            {/* Trial Plan */}
            <div className="bg-gradient-to-br from-gray-900/40 to-gray-800/40 backdrop-blur-md rounded-2xl border border-gray-500/20 p-8 shadow-xl hover:shadow-gray-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-2">Trial</h4>
                <div className="text-3xl font-bold text-gray-300 mb-4">Free</div>
                <p className="text-gray-400 text-sm mb-6">2 weeks to explore</p>
                <ul className="text-left text-gray-300 space-y-2 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    2 Content Packages
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    5 Custom Content
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    1 Bulk Generation
                  </li>
                </ul>
                <Button 
                  onClick={handleSignUp}
                  className="w-full bg-gray-600 hover:bg-gray-500 text-white"
                >
                  Start Trial
                </Button>
              </div>
            </div>

            {/* Basic Plan */}
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/40 backdrop-blur-md rounded-2xl border border-blue-500/20 p-8 shadow-xl hover:shadow-blue-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-2">Basic</h4>
                <div className="text-3xl font-bold text-blue-300 mb-4">€49</div>
                <p className="text-gray-400 text-sm mb-6">per month</p>
                <ul className="text-left text-gray-300 space-y-2 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    4 Content Packages
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Basic Scheduling
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Standard Support
                  </li>
                </ul>
                <Button 
                  onClick={() => router.push('/auth/signup')}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Choose Basic
                </Button>
              </div>
            </div>

            {/* Initiate Plan */}
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/40 backdrop-blur-md rounded-2xl border border-purple-500/20 p-8 shadow-xl hover:shadow-purple-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-2">Initiate</h4>
                <div className="text-3xl font-bold text-purple-300 mb-4">€99</div>
                <p className="text-gray-400 text-sm mb-6">per month</p>
                <ul className="text-left text-gray-300 space-y-2 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    8 Content Packages
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    10 Custom Content
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Advanced Scheduling
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Priority Support
                  </li>
                </ul>
                <Button 
                  onClick={() => router.push('/auth/signup')}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white"
                >
                  Choose Initiate
                </Button>
              </div>
            </div>

            {/* Transcendant Plan */}
            <div className="bg-gradient-to-br from-pink-900/40 to-pink-800/40 backdrop-blur-md rounded-2xl border border-pink-500/20 p-8 shadow-xl hover:shadow-pink-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-2">Transcendant</h4>
                <div className="text-3xl font-bold text-pink-300 mb-4">€199</div>
                <p className="text-gray-400 text-sm mb-6">per month</p>
                <ul className="text-left text-gray-300 space-y-2 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    12 Content Packages
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Unlimited Custom Content
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Advanced Analytics
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Priority Support
                  </li>
                </ul>
                <Button 
                  onClick={() => router.push('/auth/signup')}
                  className="w-full bg-pink-600 hover:bg-pink-500 text-white"
                >
                  Choose Transcendant
                </Button>
              </div>
            </div>

            {/* Universal Plan */}
            <div className="bg-gradient-to-br from-yellow-900/40 to-orange-800/40 backdrop-blur-md rounded-2xl border border-yellow-500/20 p-8 shadow-xl hover:shadow-yellow-500/30 transition-all duration-500 transform hover:scale-105 hover:-translate-y-2">
              <div className="text-center">
                <h4 className="text-xl font-bold text-white mb-2">Universal</h4>
                <div className="text-3xl font-bold text-yellow-300 mb-4">€499</div>
                <p className="text-gray-400 text-sm mb-6">per month</p>
                <ul className="text-left text-gray-300 space-y-2 mb-8">
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Unlimited Content Packages
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Unlimited Custom Content
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Unlimited Bulk Generation
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    Custom Integrations
                  </li>
                  <li className="flex items-center">
                    <span className="text-green-400 mr-2">✓</span>
                    White-label Options
                  </li>
                </ul>
                <Button 
                  onClick={() => router.push('/auth/signup')}
                  className="w-full bg-yellow-600 hover:bg-yellow-500 text-white"
                >
                  Choose Universal
                </Button>
              </div>
            </div>
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
          </div>
          
          {/* Platform Logos Grid */}
          <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* X (Twitter) */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900/20 to-black/20 backdrop-blur-md rounded-xl border border-gray-500/20 shadow-lg hover:shadow-gray-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-gray-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-xs group-hover:text-gray-200 transition-colors duration-300">X</span>
            </div>

            {/* LinkedIn */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-900/20 to-indigo-800/20 backdrop-blur-md rounded-xl border border-blue-500/20 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-blue-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-xs group-hover:text-blue-200 transition-colors duration-300">LinkedIn</span>
            </div>

            {/* Instagram */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-pink-900/20 to-purple-800/20 backdrop-blur-md rounded-xl border border-pink-500/20 shadow-lg hover:shadow-pink-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-pink-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
          </div>
              <span className="text-white font-medium text-xs group-hover:text-pink-200 transition-colors duration-300">Instagram</span>
        </div>

            {/* Facebook */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-900/20 to-blue-700/20 backdrop-blur-md rounded-xl border border-blue-500/20 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-blue-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-xs group-hover:text-blue-200 transition-colors duration-300">Facebook</span>
            </div>

            {/* YouTube */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-red-900/20 to-red-800/20 backdrop-blur-md rounded-xl border border-red-500/20 shadow-lg hover:shadow-red-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-red-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-xs group-hover:text-red-200 transition-colors duration-300">YouTube</span>
            </div>

            {/* Discord */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900/20 to-purple-800/20 backdrop-blur-md rounded-xl border border-indigo-500/20 shadow-lg hover:shadow-indigo-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-indigo-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-xs group-hover:text-indigo-200 transition-colors duration-300">Discord</span>
            </div>

            {/* Reddit */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-900/20 to-red-800/20 backdrop-blur-md rounded-xl border border-orange-500/20 shadow-lg hover:shadow-orange-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-orange-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-5.247a1.25 1.25 0 0 1 2.277-.657l.01.02 1.068 2.16zm-9.02 0c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056L4.744 0a1.25 1.25 0 0 1 2.277-.657l.01.02 1.068 2.16zm4.01 6.5c-2.485 0-4.5 2.015-4.5 4.5s2.015 4.5 4.5 4.5 4.5-2.015 4.5-4.5-2.015-4.5-4.5-4.5zm0 1.5c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-xs group-hover:text-orange-200 transition-colors duration-300">Reddit</span>
            </div>

            {/* WordPress */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-900/20 to-gray-800/20 backdrop-blur-md rounded-xl border border-blue-500/20 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-gray-700 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-blue-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21.469 6.825c.84 1.537 1.318 3.3 1.318 5.175 0 3.979-2.156 7.456-5.363 9.325l3.295-9.527c.615-1.54.82-2.771.82-3.864 0-.405-.026-.78-.07-1.11m-7.981.105c.647-.03 1.232-.105 1.232-.105.582-.075.514-.93-.067-.899 0 0-1.755.135-2.88.135-1.064 0-2.85-.15-2.85-.15-.584-.03-.661.855-.075.885 0 0 .54.061 1.125.105l1.68 4.605-2.37-6.72L8.1 6.9c.648-.03 1.234-.1 1.234-.1.585-.075.516-.93-.065-.896 0 0-1.746.138-2.874.138-.2 0-.438-.008-.69-.015C4.911 3.15 3.8 4.4 3.8 6.9c0 .405.026.78.07 1.11.51-1.5 1.51-2.78 2.77-3.72-.9-1.065-2.01-1.8-3.27-2.13-.405-.075-.81-.12-1.215-.12-2.16 0-4.05 1.2-5.1 3-1.05-1.8-2.94-3-5.1-3-.405 0-.81.045-1.215.12-1.26.33-2.37 1.065-3.27 2.13 1.26.94 2.26 2.22 2.77 3.72.044-.33.07-.705.07-1.11 0-2.5-1.11-3.75-2.49-3.75-.2 0-.438.008-.69.015C1.35 1.5 0 3.6 0 6.9c0 3.3 1.8 6.075 4.5 7.8 2.7 1.725 6.3 2.25 9.9 1.5.9-.225 1.8-.525 2.7-.9 2.7-1.2 4.5-3.975 4.5-7.8 0-3.3-1.8-6.075-4.5-7.8-2.7-1.725-6.3-2.25-9.9-1.5z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-xs group-hover:text-blue-200 transition-colors duration-300">WordPress</span>
          </div>

            {/* Telegram */}
            <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-900/20 to-cyan-800/20 backdrop-blur-md rounded-xl border border-blue-500/20 shadow-lg hover:shadow-blue-500/30 transition-all duration-300 transform hover:scale-105 group">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center mb-2 shadow-md group-hover:shadow-blue-400/50 transition-all duration-300">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <span className="text-white font-medium text-xs group-hover:text-blue-200 transition-colors duration-300">Telegram</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-800 border-t border-purple-500/20">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg width=\"60\" height=\"60\" viewBox=\"0 0 60 60\" xmlns=\"http://www.w3.org/2000/svg\"%3E%3Cg fill=\"none\" fill-rule=\"evenodd\"%3E%3Cg fill=\"%239C92AC\" fill-opacity=\"0.05\"%3E%3Ccircle cx=\"30\" cy=\"30\" r=\"2\"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-30"></div>
          
          <div className="relative container mx-auto px-6 py-16">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mb-12">
              {/* Brand Section */}
              <div className="lg:col-span-1">
                <div className="flex items-center mb-6">
                  <Logo className="h-10 w-10 mr-4" />
                  <span className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400">
                    Timeline Alchemy
                  </span>
                </div>
                <p className="text-gray-300 text-base leading-relaxed mb-6 max-w-md">
                  Transform your content creation with AI-powered social media management. 
                  Create, schedule, and publish across all platforms with divine precision.
                </p>
                <div className="flex space-x-4">
                  <a href="#" className="group p-3 bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-xl border border-purple-500/20 hover:border-purple-400/40 transition-all duration-300 hover:scale-105">
                    <svg className="h-5 w-5 text-gray-300 group-hover:text-purple-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  <a href="#" className="group p-3 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-xl border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:scale-105">
                    <svg className="h-5 w-5 text-gray-300 group-hover:text-blue-400 transition-colors" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="text-white font-bold text-lg mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Quick Links
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/auth/signup" className="group flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-pink-400 transition-colors"></span>
                      Get Started
                    </a>
                  </li>
                  <li>
                    <a href="/portfolio" className="group flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-pink-400 transition-colors"></span>
                      Portfolio
                    </a>
                  </li>
                  <li>
                    <a href="/auth/signin" className="group flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-pink-400 transition-colors"></span>
                      Sign In
                    </a>
                  </li>
                  <li>
                    <a href="/dashboard" className="group flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-pink-400 transition-colors"></span>
                      Dashboard
                    </a>
                  </li>
                </ul>
              </div>

              {/* Legal */}
              <div>
                <h3 className="text-white font-bold text-lg mb-6 bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
                  Legal
                </h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/privacy-policy" className="group flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-pink-400 transition-colors"></span>
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/terms-of-service" className="group flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-pink-400 transition-colors"></span>
                      Terms of Service
                    </a>
                  </li>
                  <li>
                    <a href="/cookie-policy" className="group flex items-center text-gray-300 hover:text-purple-400 transition-colors duration-300">
                      <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 group-hover:bg-pink-400 transition-colors"></span>
                      Cookie Policy
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="border-t border-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 pt-8">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <p className="text-gray-400 text-sm mb-4 md:mb-0">
                  © 2024 Timeline Alchemy. All rights reserved.
                </p>
                <p className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 text-sm font-medium">
                  ✨ Crafted with divine precision ✨
                </p>
              </div>
          </div>
        </div>
      </footer>
      </main>
    </div>
  )
}