'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if this is a social media success callback
        const urlParams = new URLSearchParams(window.location.search)
        const linkedinSuccess = urlParams.get('linkedin_success')
        const twitterSuccess = urlParams.get('twitter_success')
        
        if (linkedinSuccess) {
          // LinkedIn OAuth was successful, redirect to socials page
          router.push('/dashboard/socials?success=linkedin_connected')
          return
        }
        
        if (twitterSuccess) {
          // Twitter OAuth was successful, redirect to socials page
          const username = urlParams.get('username')
          router.push(`/dashboard/socials?success=twitter_connected&username=${username}`)
          return
        }

        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          router.push('/auth/signin?error=auth_callback_failed')
          return
        }

        if (data.session) {
          // User is authenticated, automatically add them to admin organization
          try {
            await fetch('/api/auto-join-admin-org', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ userId: data.session.user.id }),
            })
          } catch (orgError) {
            console.error('Error adding user to admin organization:', orgError)
            // Don't block the user flow, this is a background process
          }
          
          // Redirect to dashboard
          router.push('/dashboard')
        } else {
          // No session, redirect to sign in
          router.push('/auth/signin')
        }
      } catch (error) {
        console.error('Unexpected error:', error)
        router.push('/auth/signin?error=unexpected_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-lg text-gray-600">Completing authentication...</p>
      </div>
    </div>
  )
}
