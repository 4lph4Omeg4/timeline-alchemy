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
        const { data: orgs, error } = await supabase
          .from('organizations')
          .select('*')
          .order('created_at', { ascending: false })

        if (orgs) {
          setOrganizations(orgs)
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

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Organizations</CardTitle>
          <CardDescription className="text-gray-300">
            {organizations.length} organizations found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {organizations.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No organizations found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {organizations.map((org) => (
                <div key={org.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{org.name}</h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        <Badge variant="secondary" className="bg-gray-600 text-gray-200">
                          {org.plan}
                        </Badge>
                        <span>Created: {new Date(org.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
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
