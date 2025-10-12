'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Facebook, Instagram, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface FacebookPage {
  id: string
  name: string
  access_token: string
  category: string
  instagram_business_account?: {
    id: string
    username: string
  }
}

export default function SelectPagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const platform = searchParams.get('platform') // 'facebook' or 'instagram'
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    initializeAndFetchPages()
  }, [])

  const initializeAndFetchPages = async () => {
    // Get user ID from Supabase auth
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      setUserId(user.id)
      await fetchPages(user.id)
    } else {
      toast.error('Not authenticated')
      router.push('/auth/signin')
    }
  }

  const fetchPages = async (userId: string) => {
    try {
      const response = await fetch(`/api/facebook/pages?user_id=${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch pages')
      }

      const data = await response.json()
      
      console.log('📘 Facebook Pages API response:', data)
      
      if (data.success) {
        console.log(`✅ Successfully fetched ${data.pages?.length || 0} pages`)
        
        if (data.debug) {
          console.log('🔍 Debug info:', data.debug)
        }
        
        setPages(data.pages)
        
        // If filtering for Instagram, only show pages with Instagram Business Account
        if (platform === 'instagram') {
          const instagramPages = data.pages.filter((page: FacebookPage) => page.instagram_business_account)
          setPages(instagramPages)
          
          if (instagramPages.length === 0) {
            toast.error('No Instagram Business Accounts found. Connect your Instagram to a Facebook Page first.')
            console.warn('⚠️ No Instagram Business Accounts found in pages:', data.pages)
          }
        }
        
        if (data.pages.length === 0) {
          console.warn('⚠️ No pages returned from API')
          toast.error('No Facebook Pages found. Make sure you are an admin of at least one Facebook Page.')
        }
      } else {
        console.error('❌ Failed to fetch pages:', data)
        throw new Error(data.error || 'Failed to fetch pages')
      }
    } catch (error: any) {
      console.error('Error fetching pages:', error)
      toast.error(error.message || 'Failed to load pages')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPage = async () => {
    if (!selectedPageId) {
      toast.error('Please select a page')
      return
    }

    if (!userId) {
      toast.error('Not authenticated')
      return
    }

    setSaving(true)
    try {
      const selectedPage = pages.find(p => p.id === selectedPageId)
      
      if (!selectedPage) {
        throw new Error('Page not found')
      }

      // Save the selected page connection
      const response = await fetch('/api/facebook/save-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: platform || 'facebook',
          page: selectedPage,
          userId: userId,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`${platform === 'instagram' ? 'Instagram' : 'Facebook Page'} connected successfully!`)
        router.push('/dashboard/socials?success=page_connected')
      } else {
        throw new Error(data.error || 'Failed to save page')
      }
    } catch (error: any) {
      console.error('Error saving page:', error)
      toast.error(error.message || 'Failed to connect page')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-purple-200">Loading your pages...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-pink-900 p-8">
      <div className="max-w-4xl mx-auto">
        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-2xl text-white flex items-center gap-2">
              {platform === 'instagram' ? (
                <Instagram className="h-6 w-6 text-pink-400" />
              ) : (
                <Facebook className="h-6 w-6 text-blue-400" />
              )}
              Select Your {platform === 'instagram' ? 'Instagram Account' : 'Facebook Page'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {platform === 'instagram' 
                ? 'Choose which Instagram Business Account to connect for posting'
                : 'Choose which Facebook Page to connect for posting'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">
                  {platform === 'instagram' 
                    ? 'No Instagram Business Accounts found.'
                    : 'No Facebook Pages found.'}
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/dashboard/socials')}
                  className="border-purple-500/50 text-purple-200"
                >
                  Back to Socials
                </Button>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => setSelectedPageId(page.id)}
                      className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                        selectedPageId === page.id
                          ? 'border-purple-500 bg-purple-500/20'
                          : 'border-purple-500/30 bg-black/20 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            {platform === 'instagram' ? (
                              <Instagram className="h-5 w-5 text-pink-400" />
                            ) : (
                              <Facebook className="h-5 w-5 text-blue-400" />
                            )}
                            <div>
                              <h3 className="text-white font-semibold">
                                {platform === 'instagram' && page.instagram_business_account
                                  ? `@${page.instagram_business_account.username}`
                                  : page.name}
                              </h3>
                              <p className="text-sm text-gray-400">
                                {platform === 'instagram' 
                                  ? `Connected to Facebook Page: ${page.name}`
                                  : page.category}
                              </p>
                            </div>
                          </div>
                        </div>
                        {selectedPageId === page.id && (
                          <CheckCircle2 className="h-6 w-6 text-purple-400" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/dashboard/socials')}
                    className="border-gray-500/50 text-gray-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSelectPage}
                    disabled={!selectedPageId || saving}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Connecting...
                      </>
                    ) : (
                      'Connect Selected Page'
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

