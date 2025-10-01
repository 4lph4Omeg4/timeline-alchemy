'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { Subscription } from '@/types/index'

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const { data: subs, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            organizations(name)
          `)
          .order('created_at', { ascending: false })

        if (subs) {
          // Filter out Admin Organization subscriptions
          const nonAdminSubs = subs.filter((sub: any) => 
            sub.organizations?.name !== 'Admin Organization'
          )
          setSubscriptions(nonAdminSubs)
        }
      } catch (error) {
        console.error('Error fetching subscriptions:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubscriptions()
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
        <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
        <p className="text-gray-300 mt-2">
          Monitor all subscription activity
        </p>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">All Subscriptions</CardTitle>
          <CardDescription className="text-gray-300">
            {subscriptions.length} subscriptions found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400">No subscriptions found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map((sub) => (
                <div key={sub.id} className="border border-gray-600 rounded-lg p-4 bg-gray-700">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium text-white">
                        {(sub as any).organizations?.name || 'Unknown Organization'}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                        <Badge 
                          variant="secondary" 
                          className={`${
                            sub.status === 'active' ? 'bg-green-600 text-green-100' :
                            sub.status === 'canceled' ? 'bg-red-600 text-red-100' :
                            'bg-yellow-600 text-yellow-100'
                          }`}
                        >
                          {sub.status}
                        </Badge>
                        <Badge variant="secondary" className="bg-gray-600 text-gray-200">
                          {sub.plan}
                        </Badge>
                        <span>Created: {new Date(sub.created_at).toLocaleDateString()}</span>
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
