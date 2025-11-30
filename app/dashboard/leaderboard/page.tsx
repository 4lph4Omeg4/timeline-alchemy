'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/ui/star-rating'
import { BlogPost } from '@/types/index'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface TopPackage extends BlogPost {
  rank: number
}

export default function LeaderboardPage() {
  const [topPackages, setTopPackages] = useState<TopPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState<'all' | 'week' | 'month'>('all')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    fetchTopPackages()
  }, [timeframe])

  const fetchTopPackages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/signin')
        return
      }

      // Get user's organization
      const { data: orgMembers, error: orgError } = await supabase
        .from('org_members')
        .select('org_id, role')
        .eq('user_id', user.id)

      if (orgError || !orgMembers || orgMembers.length === 0) {
        console.error('Error getting user organization:', orgError)
        toast.error('No organization found')
        router.push('/create-organization')
        return
      }

      // Prioritize organization where user is owner
      const ownedOrg = (orgMembers as any[]).find(member => member.role === 'owner')
      const orgId = ownedOrg ? ownedOrg.org_id : (orgMembers as any[])[0].org_id

      // Build query based on timeframe
      let query = supabase
        .from('blog_posts')
        .select('*')
        .or(`org_id.eq.${orgId},and(created_by_admin.eq.true)`)
        .gte('average_rating', 1) // Only show packages with at least 1 rating
        .order('average_rating', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(20)

      // Apply timeframe filter
      if (timeframe !== 'all') {
        const now = new Date()
        let startDate: Date

        if (timeframe === 'week') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        } else { // month
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        }

        query = query.gte('created_at', startDate.toISOString())
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching top packages:', error)
        toast.error('Failed to load leaderboard')
      } else {
        // Add rank to packages
        const rankedPackages = (data || []).map((package_: any, index: number) => ({
          ...package_,
          rank: index + 1
        }))
        setTopPackages(rankedPackages)
      }
    } catch (error) {
      console.error('Unexpected error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-500 text-black' // Gold
      case 2:
        return 'bg-gray-400 text-black' // Silver
      case 3:
        return 'bg-orange-600 text-white' // Bronze
      default:
        return 'bg-gray-600 text-white'
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇'
      case 2:
        return '🥈'
      case 3:
        return '🥉'
      default:
        return `#${rank}`
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">🏆 Package Leaderboard</h1>
          <p className="text-gray-300 mt-2">
            Discover the most highly-rated content packages in your organization
          </p>
        </div>
        <Link href="/dashboard/content/list">
          <Button variant="outline">Back to Content Library</Button>
        </Link>
      </div>

      {/* Timeframe Filter */}
      <div className="flex items-center space-x-4">
        <span className="text-gray-300 text-sm font-medium">Timeframe:</span>
        <div className="flex space-x-2">
          {(['all', 'week', 'month'] as const).map((timeframeType) => (
            <Button
              key={timeframeType}
              variant={timeframe === timeframeType ? 'default' : 'outline'}
              onClick={() => setTimeframe(timeframeType)}
              size="sm"
              className="capitalize"
            >
              {timeframeType === 'all' ? 'All Time' :
                timeframeType === 'week' ? 'This Week' : 'This Month'}
            </Button>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      {topPackages.length === 0 ? (
        <Card className="bg-gray-900 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold text-white mb-2">No rated packages yet</h3>
            <p className="text-gray-400 text-center mb-6">
              Start rating packages to see them appear on the leaderboard!
            </p>
            <Link href="/dashboard/content/list">
              <Button>Browse Packages</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Top 3 Podium */}
          {topPackages.slice(0, 3).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {topPackages.slice(0, 3).map((package_, index) => (
                <Card
                  key={package_.id}
                  className={`bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors ${index === 0 ? 'ring-2 ring-yellow-500' :
                    index === 1 ? 'ring-2 ring-gray-400' :
                      'ring-2 ring-orange-600'
                    }`}
                >
                  <CardHeader className="text-center">
                    <div className="text-4xl mb-2">{getRankIcon(package_.rank)}</div>
                    <CardTitle className="text-white text-lg line-clamp-2">
                      {package_.title}
                    </CardTitle>
                    <Badge className={`${getRankBadgeColor(package_.rank)} mx-auto`}>
                      {package_.rank === 1 ? 'Champion' :
                        package_.rank === 2 ? 'Runner-up' : 'Third Place'}
                    </Badge>
                  </CardHeader>
                  <CardContent className="text-center space-y-3">
                    <div className="flex justify-center">
                      <StarRating
                        rating={package_.average_rating || 0}
                        size="md"
                        showNumber={true}
                      />
                    </div>
                    <p className="text-gray-400 text-sm">
                      {package_.rating_count || 0} {package_.rating_count === 1 ? 'rating' : 'ratings'}
                    </p>
                    <p className="text-gray-300 text-sm line-clamp-6">
                      {package_.content.substring(0, 1500)}...
                    </p>
                    <div className="mt-4"></div>
                    <Link href={`/dashboard/content/package/${package_.id}`}>
                      <Button size="sm" className="w-full">
                        View Package
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Rest of the Leaderboard */}
          {topPackages.slice(3).length > 0 && (
            <div className="space-y-3">
              <h2 className="text-xl font-semibold text-white">Complete Rankings</h2>
              {topPackages.slice(3).map((package_) => (
                <Card key={package_.id} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <Badge className={`${getRankBadgeColor(package_.rank)} min-w-[2rem] text-center`}>
                          {package_.rank}
                        </Badge>
                        <div className="flex-1">
                          <h3 className="text-white font-medium line-clamp-1">
                            {package_.title}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <StarRating
                              rating={package_.average_rating || 0}
                              size="sm"
                              showNumber={true}
                            />
                            <span className="text-gray-400 text-sm">
                              ({package_.rating_count || 0} {package_.rating_count === 1 ? 'rating' : 'ratings'})
                            </span>
                            {package_.created_by_admin && (
                              <Badge className="bg-purple-600 text-white text-xs">
                                Admin Package
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 ml-4">
                        <span className="text-gray-400 text-sm whitespace-nowrap">
                          {formatDate(package_.created_at)}
                        </span>
                        <Link href={`/dashboard/content/package/${package_.id}`}>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
