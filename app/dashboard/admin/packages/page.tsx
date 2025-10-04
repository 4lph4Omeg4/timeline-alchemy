'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { Loader } from '@/components/Loader'
import { Loader2, Image as ImageIcon } from 'lucide-react'

interface AdminPackage {
  id: string
  title: string
  content: string
  state: string
  created_at: string
  published_at: string | null
  scheduled_for: string | null
  images?: Array<{ id: string; url: string }>
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<AdminPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [generatingImages, setGeneratingImages] = useState<Set<string>>(new Set())

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        console.error('Error getting user:', userError)
        setLoading(false)
        return
      }

      // Get admin's organization
      const { data: orgMember, error: orgError } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .single()

      if (orgError || !orgMember) {
        console.error('Error getting admin organization:', orgError)
        setLoading(false)
        return
      }

      // Fetch admin-created packages with images
      const { data: packagesData, error: packagesError } = await supabase
        .from('blog_posts')
        .select(`
          id,
          title,
          content,
          state,
          created_at,
          published_at,
          scheduled_for,
          images (
            id,
            url
          )
        `)
        .eq('org_id', orgMember.org_id)
        .eq('created_by_admin', true)
        .order('created_at', { ascending: false })

      if (packagesError) {
        console.error('Error fetching packages:', packagesError)
        toast.error('Failed to fetch packages')
        return
      }

      // Transform the data
      const packagesList: AdminPackage[] = (packagesData || []).map((pkg: any) => ({
        id: pkg.id,
        title: pkg.title,
        content: pkg.content,
        state: pkg.state,
        created_at: pkg.created_at,
        published_at: pkg.published_at,
        scheduled_for: pkg.scheduled_for,
        images: pkg.images || [],
      }))

      setPackages(packagesList)
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const getStateColor = (state: string) => {
    switch (state) {
      case 'draft':
        return 'bg-yellow-600'
      case 'scheduled':
        return 'bg-blue-600'
      case 'published':
        return 'bg-green-600'
      default:
        return 'bg-gray-500'
    }
  }

  const getStateText = (state: string) => {
    switch (state) {
      case 'draft':
        return 'Draft'
      case 'scheduled':
        return 'Scheduled'
      case 'published':
        return 'Published'
      default:
        return 'Unknown'
    }
  }

  const handleGenerateImage = async (pkg: AdminPackage) => {
    setGeneratingImages(prev => new Set(prev).add(pkg.id))
    
    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: pkg.title,
          size: '1024x1024',
          style: 'vivid'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate image')
      }

      const result = await response.json()
      
      if (result.success && result.imageUrl) {
        // Save the image to the package
        const { error: imageError } = await supabase
          .from('images')
          .insert({
            post_id: pkg.id,
            url: result.imageUrl,
            org_id: (await supabase.from('org_members').select('org_id').eq('user_id', (await supabase.auth.getUser()).data.user?.id).eq('role', 'owner').single()).data?.org_id
          })

        if (imageError) {
          console.error('Error saving image:', imageError)
          toast.error('Image generated but failed to save')
        } else {
          toast.success('Image generated and saved successfully!')
          fetchPackages() // Refresh to show the new image
        }
      } else {
        toast.error('Failed to generate image')
      }
    } catch (error) {
      console.error('Error generating image:', error)
      toast.error('Failed to generate image')
    } finally {
      setGeneratingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(pkg.id)
        return newSet
      })
    }
  }

  const handleDeletePackage = async (packageId: string) => {
    if (!confirm('Are you sure you want to delete this package? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', packageId)

      if (error) {
        console.error('Error deleting package:', error)
        toast.error('Failed to delete package')
      } else {
        toast.success('Package deleted successfully')
        fetchPackages() // Refresh the list
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-16 w-16 text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Admin Packages</h1>
          <p className="text-gray-300 mt-2">
            Manage packages created for your clients.
          </p>
        </div>
        <Link href="/dashboard/admin/create-package">
          <Button>Create New Package</Button>
        </Link>
      </div>

      {packages.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800 text-center py-12">
          <CardTitle className="text-white">No Packages Found</CardTitle>
          <CardDescription className="text-gray-400 mt-2">
            Start by creating packages for your clients.
          </CardDescription>
          <Link href="/dashboard/admin/create-package">
            <Button className="mt-6">Create Your First Package</Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="bg-gray-900 border-gray-800 flex flex-col">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg line-clamp-1">
                    {pkg.title}
                  </CardTitle>
                  <Badge className={`${getStateColor(pkg.state)} text-white ml-2`}>
                    {getStateText(pkg.state)}
                  </Badge>
                </div>
                <CardDescription className="text-gray-400">
                  <div>Created {formatDate(pkg.created_at)}</div>
                  {pkg.published_at && (
                    <div>Published {formatDate(pkg.published_at)}</div>
                  )}
                  {pkg.scheduled_for && (
                    <div className="text-blue-400">
                      Scheduled for {formatDate(pkg.scheduled_for)}
                    </div>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow flex flex-col justify-between">
                {/* Image Status */}
                {pkg.images && pkg.images.length > 0 && (
                  <div className="mb-3 p-2 bg-green-900/20 border border-green-500/30 rounded text-xs text-green-300">
                    🖼️ {pkg.images.length} image(s) attached
                  </div>
                )}
                
                <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
                  <Link href={`/dashboard/content/package/${pkg.id}`}>
                    <Button className="w-full">
                      📦 View Package
                    </Button>
                  </Link>
                  
                  {/* Generate Image Button */}
                  <Button
                    variant="outline"
                    onClick={() => handleGenerateImage(pkg)}
                    disabled={generatingImages.has(pkg.id)}
                    className="w-full border-purple-500 text-purple-400 hover:bg-purple-900/30"
                  >
                    {generatingImages.has(pkg.id) ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        {pkg.images && pkg.images.length > 0 ? 'Generate New Image' : 'Generate Image'}
                      </>
                    )}
                  </Button>
                  
                  <div className="flex space-x-2">
                    <Link href={`/dashboard/content/edit/${pkg.id}`}>
                      <Button variant="outline" className="flex-1">
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      onClick={() => handleDeletePackage(pkg.id)}
                      className="flex-1"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
