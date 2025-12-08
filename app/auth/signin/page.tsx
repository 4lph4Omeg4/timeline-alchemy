'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import toast from 'react-hot-toast'

export default function SignInPage() {
  const supabase = createClient()
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

  const handleOAuthSignIn = async (provider: any) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
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
              <div onClick={() => router.push('/')} className="cursor-pointer">
                <Logo size="lg" showText={false} />
              </div>
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
              <Logo size="xl" showText={false} />
            </div>
            <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 font-bold">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-purple-200">
              Sign in to Timeline Alchemy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="email" className="text-purple-200 font-semibold">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-purple-200 font-semibold">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
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
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-purple-500/30" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 px-4 py-1 text-purple-300 font-semibold rounded-full border border-purple-500/30">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {/* Google */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-purple-400 transition-all"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading}
                title="Sign in with Google"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </Button>

              {/* Facebook */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-purple-400 transition-all"
                onClick={() => handleOAuthSignIn('facebook')}
                disabled={loading}
                title="Sign in with Facebook"
              >
                <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.048 0-2.73 1.347-2.73 2.802v1.171h3.829l-.502 3.668h-3.327v7.98h-5.084Z" />
                </svg>
              </Button>

              {/* Instagram */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-purple-400 transition-all group"
                onClick={() => handleOAuthSignIn('instagram')}
                disabled={loading}
                title="Sign in with Instagram"
              >
                <svg className="h-5 w-5 fill-white group-hover:fill-[#E1306C] transition-colors" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.069-4.85.069-3.204 0-3.584-.012-4.849-.069-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </Button>

              {/* GitHub */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-purple-400 transition-all"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loading}
                title="Sign in with GitHub"
              >
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                </svg>
              </Button>

              {/* LinkedIn */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-purple-400 transition-all"
                onClick={() => handleOAuthSignIn('linkedin_oidc')}
                disabled={loading}
                title="Sign in with LinkedIn"
              >
                <svg className="h-5 w-5 fill-[#0077b5]" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Button>

              {/* Twitter/X */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-purple-400 transition-all"
                onClick={() => handleOAuthSignIn('twitter')}
                disabled={loading}
                title="Sign in with Twitter"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Button>
            </div>

            <div className="text-center text-sm text-purple-200">
              Don't have an account?{' '}
              <button
                onClick={() => router.push('/auth/signup')}
                className="text-yellow-400 hover:text-yellow-300 hover:underline font-semibold transition-colors duration-300"
              >
                Sign up here
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
