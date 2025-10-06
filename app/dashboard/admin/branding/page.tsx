'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { BrandingSettings } from '@/types/index'
import { toast } from 'react-hot-toast'

export default function BrandingPage() {
  const [branding, setBranding] = useState<BrandingSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBrandingSettings()
  }, [])

  const fetchBrandingSettings = async () => {
    try {
      const response = await fetch('/api/branding?orgId=admin-org')
      if (response.ok) {
        const data = await response.json()
        setBranding(data)
      } else {
        // Initialize with default values if no branding settings exist
        setBranding({
          org_id: 'admin-org',
          logo_url: null,
          logo_position: 'bottom-right',
          logo_opacity: 0.7,
          logo_size: 0.1,
          enabled: false,
          updated_at: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Error fetching branding settings:', error)
      // Initialize with default values on error
      setBranding({
        org_id: 'admin-org',
        logo_url: null,
        logo_position: 'bottom-right',
        logo_opacity: 0.7,
        logo_size: 0.1,
        enabled: false,
        updated_at: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const uploadLogo = async () => {
    if (!selectedFile) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('logo', selectedFile)
      formData.append('orgId', 'admin-org')

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
              org_id: 'admin-org'
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

  const handleSwitchChange = async (checked: boolean) => {
    if (!branding) return
    
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
          org_id: 'admin-org'
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

  const saveSettings = async () => {
    if (!branding) return

    setSaving(true)
    try {
      const response = await fetch('/api/branding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...branding,
          org_id: 'admin-org'
        })
      })

      if (response.ok) {
        toast.success('Branding settings saved successfully!')
        // Refresh the settings to get the latest data
        await fetchBrandingSettings()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to save settings')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🎨 Branding Settings
          </h1>
          <p className="text-lg text-gray-600">
            Configure your organization's branding that will appear as watermarks on generated images.
          </p>
        </div>

        <div className="grid gap-6">
          {/* Logo Upload Section */}
          <Card>
            <CardHeader>
              <CardTitle>Logo Upload</CardTitle>
              <CardDescription>
                Upload your organization's logo to be used as a watermark on generated images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="logo">Logo File</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Supported formats: PNG, JPG, SVG. Max size: 5MB
                </p>
              </div>

              {selectedFile && (
                <div className="flex items-center gap-4">
                  <Button
                    onClick={uploadLogo}
                    disabled={uploading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {uploading ? 'Uploading...' : 'Upload Logo'}
                  </Button>
                  <span className="text-sm text-gray-600">
                    Selected: {selectedFile.name}
                  </span>
                </div>
              )}

              {branding?.logo_url && (
                <div className="mt-4">
                  <Label>Current Logo Preview</Label>
                  <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                    <img
                      src={branding.logo_url}
                      alt="Current logo"
                      className="max-h-20 max-w-32 object-contain"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Watermark Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Watermark Settings</CardTitle>
              <CardDescription>
                Configure how your logo appears as a watermark on generated images.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Enable Watermark</Label>
                  <p className="text-sm text-gray-500">
                    Show your logo as a watermark on generated images
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={branding?.enabled || false}
                  onCheckedChange={handleSwitchChange}
                />
              </div>

              <div>
                <Label htmlFor="position">Logo Position</Label>
                <Select
                  value={branding?.logo_position || 'bottom-right'}
                  onValueChange={(value: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') =>
                    setBranding(prev => prev ? { ...prev, logo_position: value } : null)
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top Left</SelectItem>
                    <SelectItem value="top-right">Top Right</SelectItem>
                    <SelectItem value="bottom-left">Bottom Left</SelectItem>
                    <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="opacity">Logo Opacity</Label>
                <Input
                  id="opacity"
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={branding?.logo_opacity || 0.7}
                  onChange={(e) =>
                    setBranding(prev => prev ? { ...prev, logo_opacity: parseFloat(e.target.value) } : null)
                  }
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Current: {Math.round((branding?.logo_opacity || 0.7) * 100)}%
                </p>
              </div>

              <div>
                <Label htmlFor="size">Logo Size</Label>
                <Input
                  id="size"
                  type="range"
                  min="0.05"
                  max="0.3"
                  step="0.05"
                  value={branding?.logo_size || 0.1}
                  onChange={(e) =>
                    setBranding(prev => prev ? { ...prev, logo_size: parseFloat(e.target.value) } : null)
                  }
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Current: {Math.round((branding?.logo_size || 0.1) * 100)}% of image
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Preview Section */}
          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
              <CardDescription>
                See how your watermark will appear on generated images.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg p-8 min-h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">🖼️</div>
                  <p>Generated image preview will appear here</p>
                  <p className="text-sm">Your watermark will be applied automatically</p>
                </div>
                
                {branding?.enabled && branding?.logo_url && (
                  <div
                    className={`absolute ${
                      branding.logo_position === 'top-left' ? 'top-4 left-4' :
                      branding.logo_position === 'top-right' ? 'top-4 right-4' :
                      branding.logo_position === 'bottom-left' ? 'bottom-4 left-4' :
                      'bottom-4 right-4'
                    }`}
                    style={{
                      opacity: branding.logo_opacity,
                      transform: `scale(${branding.logo_size * 10})`
                    }}
                  >
                    <img
                      src={branding.logo_url}
                      alt="Watermark preview"
                      className="h-8 w-8 object-contain"
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 px-8"
            >
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
