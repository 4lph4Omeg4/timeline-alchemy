'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Organization } from '@/types/index'

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        // Fetch organizations with their subscriptions to get the correct plan
        const { data: orgsWithSubs, error } = await (supabase as any)
          .from('organizations')
          .select(`
            *,
            subscriptions(
              id,
              plan,
              status,
              created_at
            )
          `)
          .order('created_at', { ascending: false })

        if (orgsWithSubs) {
          // Update organizations with subscription plan if available
          const orgsWithCorrectPlans = orgsWithSubs.map((org: any) => ({
            ...org,
            plan: org.subscriptions && org.subscriptions.length > 0 
              ? org.subscriptions[0].plan 
              : org.plan
          }))
          setOrganizations(orgsWithCorrectPlans)
        }
      } catch (error) {
        console.error('Error fetching organizations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Organizations</h1>
        <p className="text-gray-300 mt-2">
          Manage all organizations in the system
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">All Organizations</CardTitle>
          <CardDescription className="text-gray-200">
            {organizations.length} organizations found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-300">No organizations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div key={org.id} className="border border-gray-700 rounded-lg p-6 bg-gray-800 hover:bg-gray-750 transition-colors">
                  <div className="flex items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-lg">{org.name}</h3>
                      <div className="flex items-center space-x-4 mt-3 text-sm">
                        <Badge 
                          variant="secondary" 
                          className={`font-medium ${
                            org.plan === 'enterprise' ? 'bg-purple-700 text-purple-200' :
                            org.plan === 'pro' ? 'bg-blue-700 text-blue-200' :
                            'bg-gray-700 text-gray-200'
                          }`}
                        >
                          {org.plan?.charAt(0).toUpperCase() + org.plan?.slice(1) || 'Basic'}
                        </Badge>
                        <span className="text-gray-300">
                          Created: {new Date(org.created_at).toLocaleDateString()}
                        </span>
                        <span className="text-gray-300">
                          ID: {org.id.slice(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
