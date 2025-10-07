'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { supabase } from '@/lib/supabase'
import { BrandingSettings } from '@/types/index'
import { toast } from 'react-hot-toast'

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [adminOrgId, setAdminOrgId] = useState<string | null>(null)

  useEffect(() => {
    fetchAdminOrg()
  }, [])

  useEffect(() => {
    if (adminOrgId) {
      fetchBrandingSettings()
    }
  }, [adminOrgId])

  const fetchAdminOrg = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', 'Admin Organization')
        .single()

      if (error) {
        console.error('Error fetching admin org:', error)
        toast.error('Failed to fetch organization')
        return
      }

      if (data) {
        setAdminOrgId(data.id)
      }
    } catch (error) {
      console.error('Error fetching admin org:', error)
      toast.error('Failed to fetch organization')
    }
  }

  const fetchBrandingSettings = async () => {
    if (!adminOrgId) return

    try {
      const response = await fetch(`/api/branding?orgId=${adminOrgId}`)
      if (response.ok) {
        const data = await response.json()
        setBranding(data)
      } else {
        // Initialize with default values if no branding settings exist
        setBranding({
          id: '',
          organization_id: adminOrgId,
          logo_url: undefined,
          logo_position: 'bottom-right',
          logo_opacity: 0.7,
          logo_size: 0.1,
          enabled: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error)
      // Initialize with default values on error
      setBranding({
        id: '',
        organization_id: adminOrgId,
        logo_url: undefined,
        logo_position: 'bottom-right',
        logo_opacity: 0.7,
        logo_size: 0.1,
        enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadLogo = async () => {
    if (!selectedFile || !adminOrgId) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', selectedFile)
      formData.append('orgId', adminOrgId)

      const response = await fetch('/api/branding/upload-logo', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setBranding(prev => prev ? { ...prev, logo_url: data.url } : null)
        toast.success('Logo uploaded successfully!')
        setSelectedFile(null)
        
        // Auto-save the logo URL to branding settings
        try {
          await fetch('/api/branding', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              ...branding,
              logo_url: data.url,
              organization_id: adminOrgId
            })
          })
        } catch (error) {
          console.error('Error saving logo URL:', error)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to upload logo')
      }
    } catch (error) {
      console.error('Error uploading logo:', error)
      toast.error('Failed to upload logo')
    } finally {
      setUploading(false)
    }
  }

  const handlePositionChange = async (position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => {
    if (!branding || !adminOrgId) return
    
    // Update local state immediately
    setBranding(prev => prev ? { ...prev, logo_position: position } : null)
    
    // Auto-save the change
    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...branding,
          logo_position: position,
          organization_id: adminOrgId
        })
      })

      if (response.ok) {
        toast.success('Position updated!')
      } else {
        // Revert the change if save failed
        setBranding(prev => prev ? { ...prev, logo_position: branding.logo_position } : null)
        const error = await response.json()
        toast.error(error.error || 'Failed to update position')
      }
    } catch (error) {
      // Revert the change if save failed
      setBranding(prev => prev ? { ...prev, logo_position: branding.logo_position } : null)
      console.error('Error updating position:', error)
      toast.error('Failed to update position')
    }
  }

  const handleSwitchChange = async (checked: boolean) => {
    if (!branding || !adminOrgId) return
    
    // Update local state immediately
    setBranding(prev => prev ? { ...prev, enabled: checked } : null)
    
    // Auto-save the change
    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...branding,
          enabled: checked,
          organization_id: adminOrgId
        })
      })

      if (response.ok) {
        toast.success('Watermark setting updated!')
      } else {
        // Revert the change if save failed
        setBranding(prev => prev ? { ...prev, enabled: !checked } : null)
        const error = await response.json()
        toast.error(error.error || 'Failed to update setting')
      }
    } catch (error) {
      // Revert the change if save failed
      setBranding(prev => prev ? { ...prev, enabled: !checked } : null)
      console.error('Error updating switch:', error)
      toast.error('Failed to update setting')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (!branding || !adminOrgId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400">Failed to load branding settings</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-2">
          🎨 Branding Settings
        </h1>
        <p className="text-gray-400">Customize your watermark logo for generated images</p>
      </div>

      <div className="grid gap-6">
        {/* Logo Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Upload</CardTitle>
            <CardDescription>Upload your logo to be used as a watermark</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {branding.logo_url && (
              <div className="mb-4">
                <Label>Current Logo</Label>
                <div className="mt-2 p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 backdrop-blur-md rounded-lg border border-purple-500/20">
                  <img src={branding.logo_url} alt="Logo" className="max-h-32 mx-auto" />
                </div>
              </div>
            )}

            <div>
              <Label htmlFor="logo-upload">Choose Logo</Label>
              <Input
                id="logo-upload"
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="mt-2"
              />
            </div>

            <Button
              onClick={uploadLogo}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? 'Uploading...' : 'Upload Logo'}
            </Button>
          </CardContent>
        </Card>

        {/* Logo Position */}
        <Card>
          <CardHeader>
            <CardTitle>Logo Position</CardTitle>
            <CardDescription>Choose where the logo appears on images</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant={branding.logo_position === 'top-left' ? 'default' : 'outline'}
                onClick={() => handlePositionChange('top-left')}
                className="h-20"
              >
                <div className="text-center">
                  <div className="text-sm font-semibold">Top Left</div>
                  <div className="text-xs text-gray-500">↖</div>
                </div>
              </Button>
              <Button
                variant={branding.logo_position === 'top-right' ? 'default' : 'outline'}
                onClick={() => handlePositionChange('top-right')}
                className="h-20"
              >
                <div className="text-center">
                  <div className="text-sm font-semibold">Top Right</div>
                  <div className="text-xs text-gray-500">↗</div>
                </div>
              </Button>
              <Button
                variant={branding.logo_position === 'bottom-left' ? 'default' : 'outline'}
                onClick={() => handlePositionChange('bottom-left')}
                className="h-20"
              >
                <div className="text-center">
                  <div className="text-sm font-semibold">Bottom Left</div>
                  <div className="text-xs text-gray-500">↙</div>
                </div>
              </Button>
              <Button
                variant={branding.logo_position === 'bottom-right' ? 'default' : 'outline'}
                onClick={() => handlePositionChange('bottom-right')}
                className="h-20"
              >
                <div className="text-center">
                  <div className="text-sm font-semibold">Bottom Right</div>
                  <div className="text-xs text-gray-500">↘</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Enable/Disable Watermark */}
        <Card>
          <CardHeader>
            <CardTitle>Watermark Status</CardTitle>
            <CardDescription>Enable or disable the watermark on generated images</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="watermark-enabled" className="text-base">
                Watermark {branding.enabled ? 'Enabled' : 'Disabled'}
              </Label>
              <Switch
                id="watermark-enabled"
                checked={branding.enabled}
                onCheckedChange={handleSwitchChange}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
