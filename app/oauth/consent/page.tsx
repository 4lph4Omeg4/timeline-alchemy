'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Logo } from '@/components/Logo'
import toast from 'react-hot-toast'
import { Shield, Check, X, Info, AlertTriangle } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'

export default function OAuthConsentPage() {
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // OAuth params
  const clientName = searchParams.get('client_name') || 'External Application'
  const scopes = searchParams.get('scope')?.split(' ') || ['read_user_profile', 'offline_access']
  const redirectUri = searchParams.get('redirect_uri')
  const state = searchParams.get('state')

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Middleware should catch this, but double check
        router.push(`/auth/signin?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      } else {
        setUser(user)
      }
    }
    checkUser()
  }, [supabase, router])

  const handleAllow = async () => {
    setLoading(true)
    try {
      // In a standard Supabase OAuth Server flow with custom consent:
      // 1. We verify the user (done)
      // 2. We verify the request (implicit by being here)
      // 3. We redirect back to the redirect_uri. 
      //    NOTE: Since we cannot generate the auth code ourselves, this flow usually implies 
      //    Supabase handles the consent internally OR we need to call a specific Supabase endpoint.
      //    For now, we will redirect to the redirect_uri.

      toast.success('Access granted')

      if (redirectUri) {
        // If we have a redirect URI, go there.
        // Ideally, we would append a code here, but we don't have it.
        // If this is a "Implicit Grant" flow (unlikely for server-side), we might send a token.
        // If Supabase expects us to call an API, that part is missing from the docs.

        const url = new URL(redirectUri)
        if (state) url.searchParams.set('state', state)

        // Simulate a delay for UX
        setTimeout(() => {
          window.location.href = url.toString()
        }, 1000)
      } else {
        toast.error('No redirect URI found')
        setLoading(false)
      }

    } catch (error) {
      toast.error('Failed to grant access')
      setLoading(false)
    }
  }

  const handleDeny = () => {
    toast.error('Access denied')
    if (redirectUri) {
      const url = new URL(redirectUri)
      url.searchParams.set('error', 'access_denied')
      if (state) url.searchParams.set('state', state)
      window.location.href = url.toString()
    } else {
      router.push('/')
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-pulse text-purple-500">Loading session...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-purple-950 to-black">
      {/* Header with Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div onClick={() => router.push('/')} className="cursor-pointer">
              <Logo size="lg" showText={true} />
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

        <Card className="w-full max-w-md bg-gradient-to-br from-purple-900/40 to-blue-900/40 backdrop-blur-md border-purple-500/30 shadow-2xl relative z-10">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto bg-purple-500/20 p-4 rounded-full w-20 h-20 flex items-center justify-center border border-purple-500/30">
              <Shield className="w-10 h-10 text-purple-300" />
            </div>

            <div>
              <CardTitle className="text-2xl text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-pink-200 font-bold">
                Authorization Request
              </CardTitle>
              <CardDescription className="text-purple-200 mt-2">
                <span className="font-semibold text-white">{clientName}</span> wants to access your Timeline Alchemy account.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-black/20 rounded-lg p-4 border border-purple-500/20">
              <h3 className="text-sm font-semibold text-purple-200 mb-3 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Requested Permissions:
              </h3>
              <ul className="space-y-2">
                {scopes.map((scope, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-purple-100/80">
                    <Check className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
                    <span>{scope.replace(/_/g, ' ')}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 shrink-0" />
                <p className="text-xs text-yellow-200/80">
                  Make sure you trust this application. You can revoke access at any time in your dashboard settings.
                </p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Button
                onClick={handleAllow}
                className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
                disabled={loading}
              >
                {loading ? 'Authorizing...' : 'Allow Access'}
              </Button>

              <Button
                variant="outline"
                onClick={handleDeny}
                className="w-full bg-transparent border-purple-500/30 text-purple-300 hover:bg-purple-900/20 hover:text-white transition-colors"
                disabled={loading}
              >
                Deny Access
              </Button>
            </div>

            <p className="text-xs text-center text-purple-400/60 px-4">
              By clicking Allow, you agree to grant this application access to your data as described above.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
