'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { Logo } from '@/components/Logo'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CreateOrganizationPage() {
  const supabase = createClient()
  const [name, setName] = useState('')
  const [plan, setPlan] = useState<'basic' | 'initiate' | 'transcendant'>('basic')
  const [isCreating, setIsCreating] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()

  const handleCreate = async () => {
    if (!name.trim()) {
      setMessage('Please enter an organization name')
      return
    }

    setIsCreating(true)
    setMessage('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setMessage('Please sign in first')
        return
      }

      // Call API to create organization (bypasses RLS)
      const response = await fetch('/api/create-organization', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          userName: user.user_metadata?.name || user.email?.split('@')[0],
          orgName: name.trim(),
          plan: plan
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization')
      }

      setMessage('Organization created successfully! Redirecting...')
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)

    } catch (error) {
      console.error('Error creating organization:', error)
      setMessage('Failed to create organization: ' + (error as Error).message)
    } finally {
      setIsCreating(false)
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
              Create Organization
            </CardTitle>
            <CardDescription className="text-purple-200">
              You need an organization to start creating content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-purple-200 font-semibold">Organization Name</Label>
              <Input
                id="name"
                placeholder="e.g., My Company, Personal Brand, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-purple-800/30 border-purple-500/50 text-white placeholder-purple-300 focus:border-purple-400 focus:ring-purple-400/50"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="plan" className="text-purple-200 font-semibold">Plan</Label>
              <Select value={plan} onValueChange={(value: any) => setPlan(value)}>
                <SelectTrigger className="bg-purple-800/30 border-purple-500/50 text-white focus:border-purple-400 focus:ring-purple-400/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-purple-900 border-purple-500/50 text-white">
                  <SelectItem value="basic" className="focus:bg-purple-800 focus:text-white">Basic - €10/month</SelectItem>
                  <SelectItem value="initiate" className="focus:bg-purple-800 focus:text-white">Initiate - €29/month</SelectItem>
                  <SelectItem value="transcendant" className="focus:bg-purple-800 focus:text-white">Transcendant - €199/month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {message && (
              <div className={`p-3 rounded-lg text-sm font-medium border ${message.includes('successfully')
                ? 'bg-green-900/50 border-green-500/50 text-green-200'
                : 'bg-red-900/50 border-red-500/50 text-red-200'
                }`}>
                {message}
              </div>
            )}

            <Button
              onClick={handleCreate}
              disabled={isCreating || !name.trim()}
              className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-500 hover:via-pink-500 hover:to-purple-500 text-white font-bold shadow-lg hover:shadow-purple-500/50 transition-all duration-300 transform hover:scale-105"
            >
              {isCreating ? 'Creating...' : 'Create Organization'}
            </Button>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard')}
                className="text-purple-300 hover:text-white hover:bg-purple-900/30"
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
