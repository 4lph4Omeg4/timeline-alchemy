'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function CreateOrganizationPage() {
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

      // Create organization
      const { data: newOrg, error: orgError } = await (supabase as any)
        .from('organizations')
        .insert({
          name: name.trim(),
          plan: plan
        })
        .select()
        .single()

      if (orgError || !newOrg) {
        console.error('Error creating organization:', orgError)
        setMessage('Failed to create organization: ' + (orgError?.message || 'Unknown error'))
        return
      }

      // Add user as owner of the organization
      const { error: memberError } = await (supabase as any)
        .from('org_members')
        .insert({
          org_id: newOrg.id,
          user_id: user.id,
          role: 'owner'
        })

      if (memberError) {
        console.error('Error adding user to organization:', memberError)
        setMessage('Organization created but failed to add you as owner: ' + memberError.message)
        return
      }

      // Create a subscription for the organization
      const { error: subError } = await (supabase as any)
        .from('subscriptions')
        .insert({
          org_id: newOrg.id,
          stripe_customer_id: 'manual-' + newOrg.id,
          stripe_subscription_id: 'manual-sub-' + newOrg.id,
          plan: plan,
          status: 'active'
        })

      if (subError) {
        console.error('Error creating subscription:', subError)
        // Don't fail, subscription is optional
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
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Create Organization</CardTitle>
          <CardDescription className="text-gray-300">
            You need an organization to start creating content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Organization Name</Label>
            <Input
              id="name"
              placeholder="e.g., My Company, Personal Brand, etc."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-2 bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="plan" className="text-white">Plan</Label>
            <Select value={plan} onValueChange={(value: any) => setPlan(value)}>
              <SelectTrigger className="mt-2 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="basic">Basic - €10/month</SelectItem>
                <SelectItem value="initiate">Initiate - €29/month</SelectItem>
                <SelectItem value="transcendant">Transcendant - €199/month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-sm ${message.includes('successfully')
              ? 'bg-green-900 text-green-300'
              : 'bg-red-900 text-red-300'
              }`}>
              {message}
            </div>
          )}

          <Button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create Organization'}
          </Button>

          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard')}
              className="text-gray-300"
            >
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
