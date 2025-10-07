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
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Hero Section with Video */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/10 via-transparent to-transparent"></div>
        
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full overflow-hidden opacity-30">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="https://kjjrzhicspmbiitayrco.supabase.co/storage/v1/object/public/video/e6c0db74-03ee-4bb3-b08d-d94512efab91/video-promo-portfolio/timeline-alchemy%20(1).mp4" type="video/mp4" />
          </video>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 container mx-auto px-4 py-20 text-center">
          <div className="mb-8 flex justify-center">
            <Logo size="xl" showText={false} />
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-6 animate-pulse">
            Timeline Alchemy
          </h1>
          
          <p className="text-2xl md:text-3xl text-gray-200 mb-8 font-light">
            Transform Your Content Strategy with AI Magic
          </p>
          
          <p className="text-lg text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Generate stunning blog posts, social media content, and images across 9+ platforms. 
            Powered by cutting-edge AI, designed for creators who demand excellence.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <Button 
              onClick={handleSignUp}
              size="lg"
              className="text-xl px-12 py-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold shadow-2xl shadow-purple-500/50 transform hover:scale-105 transition-all duration-300"
            >
              🚀 Start Free Trial
            </Button>
            <Button 
              onClick={handleSignIn}
              size="lg"
              variant="outline"
              className="text-xl px-12 py-6 border-2 border-purple-400 text-purple-300 hover:bg-purple-900/30 font-semibold"
            >
              Sign In
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="text-purple-400 text-4xl">↓</div>
        </div>
      </section>

      {/* Free Trial Banner */}
      <section className="relative py-20 bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border-y border-purple-500/30">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block mb-6">
              <span className="text-6xl">🎉</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Start Your Journey with a <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200">Free Trial</span>
            </h2>
            <p className="text-xl text-blue-200 mb-8">
              Every new member begins with a <span className="font-bold text-yellow-300">14-day free trial</span>. 
              No credit card required. Experience the full power of Timeline Alchemy.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-yellow-400 mb-2">2</div>
                <div className="text-sm text-blue-200">Content Packages</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-yellow-400 mb-2">5</div>
                <div className="text-sm text-blue-200">Custom Generations</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-yellow-400 mb-2">1</div>
                <div className="text-sm text-blue-200">Bulk Generation</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-400/30 rounded-xl p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold text-yellow-400 mb-2">14</div>
                <div className="text-sm text-blue-200">Days Free</div>
              </div>
            </div>
            <Button 
              onClick={handleSignUp}
              size="lg"
              className="text-xl px-12 py-4 bg-gradient-to-r from-yellow-500 to-yellow-300 hover:from-yellow-400 hover:to-yellow-200 text-black font-bold shadow-2xl shadow-yellow-500/50"
            >
              Claim Your Free Trial →
            </Button>
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="relative py-24 bg-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-4">
              Choose Your Plan
            </h2>
            <p className="text-xl text-gray-300">
              Flexible pricing for creators of all levels
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {/* Basic Plan */}
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-gray-700 rounded-2xl p-8 hover:border-purple-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:scale-105">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Basic</h3>
                <div className="text-5xl font-black text-purple-400 mb-2">€49</div>
                <div className="text-gray-400 text-sm">/month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-300">
                  <span className="text-green-400 mr-2 text-xl">✓</span>
                  <span>4 content packages</span>
                </li>
                <li className="flex items-start text-gray-300">
                  <span className="text-green-400 mr-2 text-xl">✓</span>
                  <span>Basic scheduling</span>
                </li>
                <li className="flex items-start text-gray-300">
                  <span className="text-green-400 mr-2 text-xl">✓</span>
                  <span>Standard support</span>
                </li>
                <li className="flex items-start text-gray-300">
                  <span className="text-green-400 mr-2 text-xl">✓</span>
                  <span>Timeline Alchemy branding</span>
                </li>
              </ul>
              <Button 
                onClick={handleSignUp}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3"
              >
                Get Started
              </Button>
            </div>

            {/* Initiate Plan */}
            <div className="relative bg-gradient-to-br from-purple-900 to-purple-800 border-2 border-purple-600 rounded-2xl p-8 hover:border-pink-500 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/30 hover:scale-105">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Initiate</h3>
                <div className="text-5xl font-black text-pink-400 mb-2">€99</div>
                <div className="text-gray-300 text-sm">/month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-200">
                  <span className="text-green-400 mr-2 text-xl">✓</span>
                  <span>8 content packages</span>
                </li>
                <li className="flex items-start text-gray-200">
                  <span className="text-green-400 mr-2 text-xl">✓</span>
                  <span>10 custom generations</span>
                </li>
                <li className="flex items-start text-gray-200">
                  <span className="text-green-400 mr-2 text-xl">✓</span>
                  <span>Advanced scheduling</span>
                </li>
                <li className="flex items-start text-gray-200">
                  <span className="text-green-400 mr-2 text-xl">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <Button 
                onClick={handleSignUp}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold py-3"
              >
                Get Started
              </Button>
            </div>

            {/* Transcendant Plan - FEATURED */}
            <div className="relative bg-gradient-to-br from-purple-600 to-pink-600 border-4 border-yellow-400 rounded-2xl p-8 transform scale-105 hover:scale-110 transition-all duration-300 shadow-2xl shadow-purple-500/50">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-yellow-400 text-black px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                  ⭐ MOST POPULAR
                </span>
              </div>
              <div className="text-center mb-6 mt-4">
                <h3 className="text-2xl font-bold text-white mb-2">Transcendant</h3>
                <div className="text-5xl font-black text-yellow-300 mb-2">€199</div>
                <div className="text-purple-100 text-sm">/month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-white">
                  <span className="text-yellow-300 mr-2 text-xl">✓</span>
                  <span>12 content packages</span>
                </li>
                <li className="flex items-start text-white">
                  <span className="text-yellow-300 mr-2 text-xl">✓</span>
                  <span><strong>Unlimited</strong> custom content</span>
                </li>
                <li className="flex items-start text-white">
                  <span className="text-yellow-300 mr-2 text-xl">✓</span>
                  <span>Advanced analytics</span>
                </li>
                <li className="flex items-start text-white">
                  <span className="text-yellow-300 mr-2 text-xl">✓</span>
                  <span>Priority support</span>
                </li>
              </ul>
              <Button 
                onClick={handleSignUp}
                className="w-full bg-yellow-400 hover:bg-yellow-300 text-black font-bold py-3 shadow-lg"
              >
                Get Started
              </Button>
            </div>

            {/* Universal Plan */}
            <div className="relative bg-gradient-to-br from-yellow-900 to-purple-900 border-2 border-yellow-500 rounded-2xl p-8 hover:border-yellow-400 transition-all duration-300 hover:shadow-2xl hover:shadow-yellow-500/30 hover:scale-105">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">Universal</h3>
                <div className="text-5xl font-black text-yellow-400 mb-2">€499</div>
                <div className="text-gray-300 text-sm">/month</div>
              </div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start text-gray-100">
                  <span className="text-yellow-400 mr-2 text-xl">✓</span>
                  <span><strong>Unlimited</strong> everything</span>
                </li>
                <li className="flex items-start text-gray-100">
                  <span className="text-yellow-400 mr-2 text-xl">✓</span>
                  <span>Custom branding</span>
                </li>
                <li className="flex items-start text-gray-100">
                  <span className="text-yellow-400 mr-2 text-xl">✓</span>
                  <span>White-label solution</span>
                </li>
                <li className="flex items-start text-gray-100">
                  <span className="text-yellow-400 mr-2 text-xl">✓</span>
                  <span>Dedicated support</span>
                </li>
              </ul>
              <Button 
                onClick={handleSignUp}
                className="w-full bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold py-3"
              >
                Go Universal
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="relative py-20 bg-gradient-to-br from-purple-950 to-black">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Post Everywhere, Manage from One Place
            </h2>
            <p className="text-xl text-gray-300">
              Connect with your audience across 9 powerful platforms
            </p>
          </div>

          <div className="grid grid-cols-3 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Twitter/X */}
            <div className="flex flex-col items-center justify-center p-6 bg-black rounded-2xl border border-gray-700 hover:border-purple-500 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 bg-black rounded-xl flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">X (Twitter)</span>
            </div>

            {/* Facebook */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl border border-blue-500 hover:border-blue-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Facebook</span>
            </div>

            {/* Instagram */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 rounded-2xl border border-pink-500 hover:border-pink-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Instagram</span>
            </div>

            {/* LinkedIn */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-700 to-blue-900 rounded-2xl border border-blue-600 hover:border-blue-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">LinkedIn</span>
            </div>

            {/* YouTube */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-red-600 to-red-800 rounded-2xl border border-red-500 hover:border-red-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-14 h-14" viewBox="0 0 24 24" fill="white">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">YouTube</span>
            </div>

            {/* Discord */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl border border-indigo-500 hover:border-indigo-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Discord</span>
            </div>

            {/* Reddit */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-600 to-orange-800 rounded-2xl border border-orange-500 hover:border-orange-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Reddit</span>
            </div>

            {/* Telegram */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl border border-blue-400 hover:border-blue-300 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Telegram</span>
            </div>

            {/* WordPress */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-800 to-blue-950 rounded-2xl border border-blue-600 hover:border-blue-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M21.469 0.527c-2.781-0.703-5.297-0.703-8.078 0-2.781 0.703-4.922 2.844-5.625 5.625-0.703 2.781-0.703 5.297 0 8.078 0.703 2.781 2.844 4.922 5.625 5.625 2.781 0.703 5.297 0.703 8.078 0 2.781-0.703 4.922-2.844 5.625-5.625 0.703-2.781 0.703-5.297 0-8.078-0.703-2.781-2.844-4.922-5.625-5.625zM12 3.012c4.969 0 8.988 4.019 8.988 8.988s-4.019 8.988-8.988 8.988-8.988-4.019-8.988-8.988 4.019-8.988 8.988-8.988zM12 2.109c-5.453 0-9.891 4.437-9.891 9.891s4.437 9.891 9.891 9.891c5.453 0 9.891-4.437 9.891-9.891s-4.437-9.891-9.891-9.891v0zM6.891 12l3.281 9.031c-1.703-0.516-3.141-1.641-4.078-3.188l0.797-5.844zM12 12.984l-2.484 6.891c0.797 0.234 1.641 0.375 2.484 0.375s1.688-0.141 2.484-0.375l-2.484-6.891zM17.109 12l-0.797 5.844c-0.938 1.547-2.375 2.672-4.078 3.188l3.281-9.031 1.594 0z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">WordPress</span>
            </div>

            {/* TikTok */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-900 to-black rounded-2xl border border-gray-700 hover:border-gray-500 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">TikTok</span>
            </div>

            {/* Medium */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-700 to-green-900 rounded-2xl border border-green-600 hover:border-green-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Medium</span>
            </div>

            {/* Substack */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-orange-700 to-orange-900 rounded-2xl border border-orange-600 hover:border-orange-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M22.539 8.242H1.46V5.406h21.08v2.836zM1.46 10.812V24L12 18.11 22.54 24V10.812H1.46zM22.54 0H1.46v2.836h21.08V0z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Substack</span>
            </div>

            {/* Ghost */}
            <div className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-gray-800 to-gray-950 rounded-2xl border border-gray-600 hover:border-gray-400 transition-all duration-300 hover:scale-110">
              <div className="w-20 h-20 flex items-center justify-center mb-3">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="white">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.256 2.313c6.447.765 5.859 8.26 5.859 8.26l-3.026-2.227c-1.888 2.129-5.078 2.63-6.917 2.63-2.228 0-3.49-.54-3.49-.54s2.114 3.452 6.246 3.452c3.962 0 6.883-2.328 6.883-2.328l1.275 7.309s-3.672 1.575-7.086 1.575c-9.143 0-9.398-9.246-9.398-9.246C2.602 5.274 7.901 2.832 12.256 2.313z"/>
                </svg>
              </div>
              <span className="text-white font-semibold">Ghost</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-black via-purple-950 to-black border-t border-purple-500/30 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            {/* Brand Column */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <Logo size="md" showText={false} />
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Timeline Alchemy
                </span>
              </div>
              <p className="text-gray-400 leading-relaxed mb-6">
                Transform your content strategy with AI-powered magic. 
                Generate stunning blog posts, social media content, and images across multiple platforms.
              </p>
              <div className="flex gap-4">
                <Button 
                  onClick={handleSignUp}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
                >
                  Get Started
                </Button>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/portfolio" className="text-gray-400 hover:text-purple-400 transition-colors">
                    📸 Portfolio
                  </a>
                </li>
                <li>
                  <a href="/auth/signup" className="text-gray-400 hover:text-purple-400 transition-colors">
                    🚀 Sign Up
                  </a>
                </li>
                <li>
                  <a href="/auth/signin" className="text-gray-400 hover:text-purple-400 transition-colors">
                    🔑 Sign In
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-bold text-lg mb-4">Legal</h4>
              <ul className="space-y-3">
                <li>
                  <a href="/terms-of-service" className="text-gray-400 hover:text-purple-400 transition-colors">
                    📜 Terms of Service
                  </a>
                </li>
                <li>
                  <a href="/privacy-policy" className="text-gray-400 hover:text-purple-400 transition-colors">
                    🔒 Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="/cookie-policy" className="text-gray-400 hover:text-purple-400 transition-colors">
                    🍪 Cookie Settings
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-purple-500/20 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} Timeline Alchemy. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm">
                Crafted with ✨ and 💜 by the Timeline Alchemy team
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
