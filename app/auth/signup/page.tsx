'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import toast from 'react-hot-toast'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!organizationName.trim()) {
      toast.error('Please enter an organization name')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          name,
          organizationName: organizationName.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.error || 'Failed to create account')
      } else if (data.success) {
        toast.success('Account, organization, and client created successfully! You can now sign in.')
        router.push('/auth/signin')
      } else {
        toast.error(data.error || 'Failed to create account')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignUp = async (provider: any) => {
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

            {/* Sign In Button - Right */}
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push('/auth/signin')}
                variant="ghost"
                className="text-purple-300 hover:text-white hover:bg-purple-900/30"
              >
                Sign In
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
              Create Your Account
            </CardTitle>
            <CardDescription className="text-purple-200">
              Join Timeline Alchemy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-purple-200 font-semibold">Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="organizationName" className="text-purple-200 font-semibold">Organization Name</Label>
                <Input
                  id="organizationName"
                  type="text"
                  placeholder="e.g., My Company, Personal Brand"
                  value={organizationName}
                  onChange={(e) => setOrganizationName(e.target.value)}
                  required
                  className="bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
                />
              </div>
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
                  placeholder="Create your password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="confirmPassword" className="text-purple-200 font-semibold">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                disabled={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
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

            <div className="grid grid-cols-4 gap-3">
              {/* Google */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-purple-400 transition-all"
                onClick={() => handleOAuthSignUp('google')}
                disabled={loading}
                title="Sign up with Google"
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
                className="bg-[#1877F2]/10 border-purple-500/30 hover:bg-[#1877F2]/20 hover:border-[#1877F2] transition-all"
                onClick={() => handleOAuthSignUp('facebook')}
                disabled={loading}
                title="Sign up with Facebook"
              >
                <svg className="h-5 w-5 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036c-2.048 0-2.73 1.347-2.73 2.802v1.171h3.829l-.502 3.668h-3.327v7.98h-5.084Z" />
                </svg>
              </Button>

              {/* Discord */}
              <Button
                variant="outline"
                className="bg-[#5865F2]/10 border-purple-500/30 hover:bg-[#5865F2]/20 hover:border-[#5865F2] transition-all"
                onClick={() => handleOAuthSignUp('discord')}
                disabled={loading}
                title="Sign up with Discord"
              >
                <svg className="h-5 w-5 fill-[#5865F2]" viewBox="0 0 24 24">
                  <path d="M20.317 4.3698a19.7913 19.7913 0 0 0-4.8851-1.5152.0741.0741 0 0 0-.0785.0371c-.211.3753-.4447.772-.6083 1.1588a18.4034 18.4034 0 0 0-5.4868 0 20.17 20.17 0 0 0-.6172-1.1588.077.077 0 0 0-.0785-.0371 19.7363 19.7363 0 0 0-4.8852 1.5151.0699.0699 0 0 0-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 0 0 .0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 0 0 .0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 0 0-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 0 1-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 0 1 .0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 0 1 .0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 0 1-.0066.1276 12.2986 12.2986 0 0 1-1.873.8914.0766.0766 0 0 0-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 0 0 .0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 0 0 .0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 0 0-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.419-2.1568 2.419z" />
                </svg>
              </Button>

              {/* Twitter/X */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-white transition-all"
                onClick={() => handleOAuthSignUp('twitter')}
                disabled={loading}
                title="Sign up with Twitter"
              >
                <svg className="h-4 w-4 fill-white" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </Button>

              {/* GitHub */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-white transition-all"
                onClick={() => handleOAuthSignUp('github')}
                disabled={loading}
                title="Sign up with GitHub"
              >
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02a9.56 9.56 0 0 1 5 0c1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
                </svg>
              </Button>

              {/* LinkedIn */}
              <Button
                variant="outline"
                className="bg-[#0077b5]/10 border-purple-500/30 hover:bg-[#0077b5]/20 hover:border-[#0077b5] transition-all"
                onClick={() => handleOAuthSignUp('linkedin_oidc')}
                disabled={loading}
                title="Sign up with LinkedIn"
              >
                <svg className="h-5 w-5 fill-[#0077b5]" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </Button>

              {/* Slack */}
              <Button
                variant="outline"
                className="bg-[#4A154B]/10 border-purple-500/30 hover:bg-[#4A154B]/20 hover:border-[#E01E5A] transition-all"
                onClick={() => handleOAuthSignUp('slack')}
                disabled={loading}
                title="Sign up with Slack"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M5.042 15.165a2.528 2.528 0 1 0-2.528 2.528h2.528v-2.528Zm.827 0a2.528 2.528 0 1 0 2.528-2.528V10.11a2.528 2.528 0 1 0-2.528 2.528v2.528Zm0-5.883a2.528 2.528 0 1 0 2.528-2.528h-2.528v2.528Zm5.883-5.883a2.528 2.528 0 1 0-2.528 2.528v2.528h2.528V3.4ZM10.11 9.282a2.528 2.528 0 1 0 2.528 2.528V9.282h-2.528Zm5.883.827a2.528 2.528 0 1 0-2.528-2.528v2.528h2.528Zm0 5.883a2.528 2.528 0 1 0 2.528 2.528v-2.528h-2.528Zm5.883-5.883a2.528 2.528 0 1 0-2.528 2.528v-2.528h2.528Z" fill="#E01E5A" />
                  <path d="M5.869 15.165v2.528a2.528 2.528 0 1 0 2.528-2.528H5.87Zm5.883-5.883V6.754a2.528 2.528 0 1 0-2.528 2.528h2.528Z" fill="#36C5F0" />
                  <path d="M11.752 15.165a2.528 2.528 0 1 0 2.528-2.528v2.528h-2.528Zm5.883-5.883a2.528 2.528 0 1 0 2.528-2.528v2.528h-2.528Z" fill="#2EB67D" />
                  <path d="M5.869 10.11a2.528 2.528 0 1 0 2.528 2.528V10.11H5.87Zm5.883 5.883a2.528 2.528 0 1 0 2.528 2.528v-2.528h-2.528Z" fill="#ECB22E" />
                </svg>
              </Button>

              {/* Spotify */}
              <Button
                variant="outline"
                className="bg-[#1DB954]/10 border-purple-500/30 hover:bg-[#1DB954]/20 hover:border-[#1DB954] transition-all"
                onClick={() => handleOAuthSignUp('spotify')}
                disabled={loading}
                title="Sign up with Spotify"
              >
                <svg className="h-5 w-5 fill-[#1DB954]" viewBox="0 0 24 24">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                </svg>
              </Button>

              {/* Figma */}
              <Button
                variant="outline"
                className="bg-[#F24E1E]/10 border-purple-500/30 hover:bg-[#F24E1E]/20 hover:border-[#F24E1E] transition-all"
                onClick={() => handleOAuthSignUp('figma')}
                disabled={loading}
                title="Sign up with Figma"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M8.333 12a3.667 3.667 0 1 0 0-7.333 3.667 3.667 0 0 0 0 7.333zm7.334 0a3.667 3.667 0 1 0 0-7.333 3.667 3.667 0 0 0 0 7.333zm0 7.333a3.667 3.667 0 1 0 0-7.333 3.667 3.667 0 0 0 0 7.333zm-7.334 0a3.667 3.667 0 1 0 0-7.333v7.333a3.667 3.667 0 0 0 0-7.333z" fill="#F24E1E" />
                  <path d="M8.333 12a3.667 3.667 0 1 0 0 7.333 3.667 3.667 0 0 0 0-7.333z" fill="#A259FF" />
                  <path d="M8.333 4.667a3.667 3.667 0 1 0 0 7.333 3.667 3.667 0 0 0 0-7.333z" fill="#1ABCFE" />
                  <path d="M15.667 4.667a3.667 3.667 0 1 0 0 7.333 3.667 3.667 0 0 0 0-7.333z" fill="#0ACF83" />
                </svg>
              </Button>

              {/* Twitch */}
              <Button
                variant="outline"
                className="bg-[#9146FF]/10 border-purple-500/30 hover:bg-[#9146FF]/20 hover:border-[#9146FF] transition-all"
                onClick={() => handleOAuthSignUp('twitch')}
                disabled={loading}
                title="Sign up with Twitch"
              >
                <svg className="h-5 w-5 fill-[#9146FF]" viewBox="0 0 24 24">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
                </svg>
              </Button>

              {/* Notion */}
              <Button
                variant="outline"
                className="bg-white/5 border-purple-500/30 hover:bg-white/10 hover:border-white transition-all"
                onClick={() => handleOAuthSignUp('notion')}
                disabled={loading}
                title="Sign up with Notion"
              >
                <svg className="h-5 w-5 fill-white" viewBox="0 0 24 24">
                  <path d="M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28.047-.606 0-.84-.234-1.494-2.194-1.634C15.602 1.454 8.516 1.36 4.973 1.36c-1.587 0-2.474.373-2.474 1.306 0 .653.98 1.026 1.96 1.542zm-2.007 3.03c-.28 0-.56.28-.56.56v13.48c0 .327.327.607.607.607.28 0 1.214-.047 2.194-.094l.933-.046c.327 0 .56-.28.56-.56v-10.78l6.44 7.783c.42.513 1.073.793 1.633.793h.374c.28 0 .56-.28.56-.56V5.794c0-.28-.28-.56-.56-.56-.327 0-1.26.047-2.194.093l-.933.047c-.28 0-.513.28-.513.56v9.566l-5.693-6.99c-.42-.514-1.073-.794-1.634-.794l-1.213.047z" />
                </svg>
              </Button>

              {/* Zoom */}
              <Button
                variant="outline"
                className="bg-[#2D8CFF]/10 border-purple-500/30 hover:bg-[#2D8CFF]/20 hover:border-[#2D8CFF] transition-all"
                onClick={() => handleOAuthSignUp('zoom')}
                disabled={loading}
                title="Sign up with Zoom"
              >
                <svg className="h-5 w-5 fill-[#2D8CFF]" viewBox="0 0 24 24">
                  <path d="M5.042 15.165a2.528 2.528 0 1 0-2.528 2.528h2.528v-2.528Zm.827 0a2.528 2.528 0 1 0 2.528-2.528V10.11a2.528 2.528 0 1 0-2.528 2.528v2.528Zm0-5.883a2.528 2.528 0 1 0 2.528-2.528h-2.528v2.528Zm5.883-5.883a2.528 2.528 0 1 0-2.528 2.528v2.528h2.528V3.4ZM10.11 9.282a2.528 2.528 0 1 0 2.528 2.528V9.282h-2.528Zm5.883.827a2.528 2.528 0 1 0-2.528-2.528v2.528h2.528Zm0 5.883a2.528 2.528 0 1 0 2.528 2.528v-2.528h-2.528Zm5.883-5.883a2.528 2.528 0 1 0-2.528 2.528v-2.528h2.528Z" />
                  <path d="M3.13 10.45a5.52 5.52 0 0 1 1.67-1.35 5.57 5.57 0 0 1 2.3-.49c1.92 0 3.47.56 4.65 1.68 1.18 1.12 1.77 2.64 1.77 4.56 0 1.92-.59 3.44-1.77 4.56-1.18 1.12-2.73 1.68-4.65 1.68-1.92 0-3.47-.56-4.65-1.68a6.3 6.3 0 0 1-1.77-4.56c0-1.6.4-2.9 1.2-3.9 0-.01.05-.16.25-.5zM18.5 8.5l-4.5 3.2v6.6l4.5 3.2c.8.6 1.5.2 1.5-.8V9.3c0-1-.7-1.4-1.5-.8z" />
                </svg>
              </Button>
            </div>

            <div className="text-center text-sm text-purple-200">
              Already have an account?{' '}
              <button
                onClick={() => router.push('/auth/signin')}
                className="text-yellow-400 hover:text-yellow-300 hover:underline font-semibold transition-colors duration-300"
              >
                Sign in here
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
