'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'
import Image from 'next/image'

export default function ProfilePage() {
  const [user, setUser] = useState<any>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [personalOrg, setPersonalOrg] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [organizationName, setOrganizationName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        toast.error('Not authenticated')
        return
      }

      setUser(authUser)
      setDisplayName(authUser.user_metadata?.name || authUser.email?.split('@')[0] || '')
      setAvatarUrl(authUser.user_metadata?.avatar_url || '')
      setAvatarPreview(authUser.user_metadata?.avatar_url || '')

      // Get user's organizations
      const { data: orgMembers } = await supabase
        .from('org_members')
        .select('org_id, role, organizations(*)')
        .eq('user_id', authUser.id)

      if (orgMembers && orgMembers.length > 0) {
        const orgs = orgMembers.map((m: any) => ({
          ...m.organizations,
          role: m.role
        }))
        setOrganizations(orgs)

        // Find personal organization (not Admin Organization and where user is owner/admin)
        const personal = orgs.find((org: any) => 
          org.name !== 'Admin Organization' && 
          (orgMembers.find((m: any) => m.org_id === org.id)?.role === 'owner' || 
           orgMembers.find((m: any) => m.org_id === org.id)?.role === 'admin')
        )
        
        if (personal) {
          setPersonalOrg(personal)
          setOrganizationName(personal.name)
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('File must be an image')
        return
      }

      setAvatarFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !user) return null

    try {
      setUploadingAvatar(true)
      
      // Generate unique filename
      // Path structure: {user_id}/avatar-{timestamp}.{ext}
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload to Supabase Storage (dedicated avatars bucket)
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, {
          upsert: true,
          contentType: avatarFile.type
        })

      if (error) throw error

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return publicUrl
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar')
      return null
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setSaving(true)

      let newAvatarUrl = avatarUrl

      // Upload avatar if changed
      if (avatarFile) {
        const uploadedUrl = await uploadAvatar()
        if (uploadedUrl) {
          newAvatarUrl = uploadedUrl
        } else {
          toast.error('Failed to upload avatar, but continuing with other updates')
        }
      }

      // Update user metadata
      const { error: userError } = await supabase.auth.updateUser({
        data: {
          name: displayName,
          avatar_url: newAvatarUrl
        }
      })

      if (userError) throw userError

      // Update organization name if personal org exists and name changed
      if (personalOrg && organizationName !== personalOrg.name) {
        const { error: orgError } = await supabase
          .from('organizations')
          .update({ 
            name: organizationName,
            updated_at: new Date().toISOString()
          })
          .eq('id', personalOrg.id)

        if (orgError) {
          console.error('Error updating organization:', orgError)
          toast.error('Failed to update organization name')
        }
      }

      toast.success('Profile updated successfully!')
      
      // Refresh profile data
      await fetchProfile()
      
      // Clear avatar file after successful save
      setAvatarFile(null)
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast.error(error.message || 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 mb-2">
          Profile Settings
        </h1>
        <p className="text-gray-400">
          Manage your personal profile and organization settings
        </p>
      </div>

      {/* Personal Information Card */}
      <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Personal Information
          </CardTitle>
          <CardDescription className="text-gray-400">
            Update your display name and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Upload */}
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarPreview ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden border-4 border-purple-500/50">
                  <Image 
                    src={avatarPreview} 
                    alt="Avatar" 
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center border-4 border-purple-500/50">
                  <span className="text-3xl text-white font-bold">
                    {displayName.charAt(0).toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <Label htmlFor="avatar" className="text-white mb-2 block">
                Profile Picture
              </Label>
              <Input
                id="avatar"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="bg-black/50 border-purple-500/30 text-white"
              />
              <p className="text-xs text-gray-400 mt-1">
                Max 5MB. Recommended: Square image, at least 200x200px
              </p>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <Label htmlFor="displayName" className="text-white mb-2 block">
              Display Name
            </Label>
            <Input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500"
            />
            <p className="text-xs text-gray-400 mt-1">
              This is how your name will appear to other creators in the community
            </p>
          </div>

          {/* Email (read-only) */}
          <div>
            <Label htmlFor="email" className="text-white mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={user?.email || ''}
              disabled
              className="bg-black/30 border-purple-500/20 text-gray-400 cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">
              Email cannot be changed. Contact support if you need assistance.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Organization Settings Card */}
      {personalOrg && (
        <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">🏢</span>
              Organization Settings
            </CardTitle>
            <CardDescription className="text-gray-400">
              Manage your personal organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Organization Name */}
            <div>
              <Label htmlFor="organizationName" className="text-white mb-2 block">
                Organization Name
              </Label>
              <Input
                id="organizationName"
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Your organization name"
                className="bg-black/50 border-purple-500/30 text-white placeholder:text-gray-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                This is your personal workspace name. It appears in your content packages.
              </p>
            </div>

            {/* Organization Info */}
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Plan:</span>
                <span className="text-white font-semibold capitalize">{personalOrg.plan}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Your Role:</span>
                <span className="text-white font-semibold capitalize">{personalOrg.role}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-sm">Created:</span>
                <span className="text-white text-sm">
                  {new Date(personalOrg.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Organizations List (Read-only) */}
      {organizations.length > 0 && (
        <Card className="bg-gradient-to-br from-purple-900/40 to-blue-900/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <span className="text-2xl">🌐</span>
              All Organizations
            </CardTitle>
            <CardDescription className="text-gray-400">
              Organizations you're a member of
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {organizations.map((org) => (
                <div
                  key={org.id}
                  className="flex items-center justify-between p-4 bg-black/30 border border-purple-500/20 rounded-lg"
                >
                  <div>
                    <h3 className="text-white font-semibold">{org.name}</h3>
                    <p className="text-gray-400 text-sm capitalize">
                      {org.role} • {org.plan} plan
                    </p>
                  </div>
                  {org.name === 'Admin Organization' && (
                    <span className="text-xs bg-green-500/20 text-green-400 px-3 py-1 rounded-full border border-green-500/30">
                      Community
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-purple-500/30 text-purple-300 hover:bg-purple-900/30"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSaveProfile}
          disabled={saving || uploadingAvatar}
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold"
        >
          {saving ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Saving...
            </>
          ) : (
            <>
              <span className="mr-2">💾</span>
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

