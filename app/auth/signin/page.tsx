'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import toast from 'react-hot-toast'

export default function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [redirectTo, setRedirectTo] = useState('/dashboard')
  const router = useRouter()

  useEffect(() => {
    // Get redirectTo from URL params on client side
    const urlParams = new URLSearchParams(window.location.search)
    const redirect = urlParams.get('redirectTo')
    if (redirect) {
      setRedirectTo(redirect)
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Welcome back!')
        
        // Organization creation is handled in dashboard layout
        
        router.push(redirectTo)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://auth.timeline-alchemy.nl/callback',
        },
      })

      if (error) {
        toast.error(error.message)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo - Left */}
            <div className="flex items-center">
              <img 
                src="https://kjjrzhicspmbiitayrco.supabase.co/storage/v1/object/public/images/TA_2.jpg" 
                alt="Timeline Alchemy Logo" 
                className="h-16 w-auto rounded-lg shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-300 cursor-pointer"
                onClick={() => router.push('/')}
              />
            </div>
            
            {/* Sign Up Button - Right */}
            <div className="flex items-center gap-4">
              <Button 
                onClick={() => router.push('/auth/signup')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold shadow-lg shadow-purple-500/50"
              >
                🚀 Start Free Trial
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative overflow-hidden flex items-center justify-center p-4 pt-32 min-h-screen">
        {/* Cosmic Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-purple-900/20 to-black"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-purple-500/15 to-purple-600/10 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.05),transparent_70%)]"></div>
        
        {/* Floating Cosmic Orbs */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-r from-purple-500/20 to-purple-400/25 rounded-full blur-xl animate-bounce"></div>
        <div className="absolute top-40 right-20 w-24 h-24 bg-gradient-to-r from-purple-400/15 to-pink-400/20 rounded-full blur-xl animate-bounce delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-20 h-20 bg-gradient-to-r from-purple-500/15 to-purple-600/20 rounded-full blur-xl animate-bounce delay-2000"></div>

        <Card className="w-full max-w-md bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-md border-purple-500/30 shadow-2xl relative z-10">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={true} />
          </div>
          <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 font-bold">
            Welcome back, Enlightened One
          </CardTitle>
          <CardDescription className="text-purple-200">
            Enter the cosmic realm of Timeline Alchemy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="email" className="text-purple-200 font-semibold">Cosmic Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your cosmic email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="password" className="text-purple-200 font-semibold">Mystical Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your mystical password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105" 
              disabled={loading}
            >
              {loading ? '✨ Entering Cosmic Realm...' : '🌟 Enter Cosmic Realm'}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-purple-500/30" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 px-4 py-1 text-purple-300 font-semibold rounded-full border border-purple-500/30">
                Or channel cosmic energy with
              </span>
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-purple-500/50 text-purple-200 hover:bg-gradient-to-r hover:from-blue-600/30 hover:to-purple-600/30 hover:border-purple-400 transition-all duration-300"
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Google Sign-In
          </Button>

          <div className="text-center text-sm text-purple-200">
            New to the cosmic realm?{' '}
            <button
              onClick={() => router.push('/auth/signup')}
              className="text-yellow-400 hover:text-yellow-300 hover:underline font-semibold transition-colors duration-300"
            >
              Begin your cosmic journey
            </button>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
