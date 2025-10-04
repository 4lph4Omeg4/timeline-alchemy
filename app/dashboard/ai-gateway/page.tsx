'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { CheckCircle, AlertCircle, Rocket, Zap, BarChart3, Cpu, RefreshCw, CreditCard } from 'lucide-react'
import toast from 'react-hot-toast'

interface GatewayStats {
  enabled: boolean
  url: string
  features: string[]
  creditsAvailable: boolean
}

interface UserUsage {
  promptTokens?: number
  completionTokens?: number
  totalTokens?: number
  requests: number
  lastUsed: string
}

interface VercelCredits {
  success: boolean
  credits: {
    available: string | number
    used: string | number
    status: string
  }
  account: {
    name: string
    email?: string
    type: string
  }
  usage?: {
    projects: number
  }
  error?: string
}

export default function AIGatewayPage() {
  const [gatewayStats, setGatewayStats] = useState<GatewayStats | null>(null)
  const [usage, setUsage] = useState<UserUsage | null>(null)
  const [vercelCredits, setVercelCredits] = useState<VercelCredits | null>(null)
  const [loading, setLoading] = useState(true)
  const [testLoading, setTestLoading] = useState(false)
  const [creditsLoading, setCreditsLoading] = useState(false)

  useEffect(() => {
    fetchGatewayStats()
    fetchVercelCredits()
  }, [])

  const fetchGatewayStats = async () => {
    try {
      const response = await fetch('/api/generate-vercel-content')
      const data = await response.json()
      
      if (data.success) {
        setGatewayStats(data.gateway)
        // Simulate usage data (this would come from Gateway analytics in production)
        setUsage({
          totalTokens: 15420,
          requests: 127,
          lastUsed: new Date().toISOString()
        })
      }
    } catch (error) {
      console.error('Failed to fetch gateway stats:', error)
      toast.error('Failed to fetch AI Gateway statistics')
    } finally {
      setLoading(false)
    }
  }

  const fetchVercelCredits = async () => {
    setCreditsLoading(true)
    try {
      const response = await fetch('/api/vercel-credits')
      const data = await response.json()
      setVercelCredits(data)
      
      if (data.success) {
        console.log('✅ Vercel credits fetched successfully')
      } else {
        console.warn('⚠️ Vercel credits fetch failed:', data.error)
      }
    } catch (error) {
      console.error('❌ Failed to fetch Vercel credits:', error)
      setVercelCredits({
        success: false,
        credits: { available: 'Error', used: 'Error', status: 'Error' },
        account: { name: 'Error', type: 'Error' },
        error: error instanceof Error ? error.message : 'Unknown error'
      })
    } finally {
      setCreditsLoading(false)
    }
  }

  const testAIGateway = async () => {
    setTestLoading(true)
    try {
      const response = await fetch('/api/generate-vercel-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'Modern web development trends',
          type: 'blog',
          tone: 'professional'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('✅ AI Gateway test successful! Enhanced content generated.')
        fetchGatewayStats() // Refresh stats
      } else {
        toast.error('❌ AI Gateway test failed: ' + data.error)
      }
    } catch (error) {
      console.error('Gateway test error:', error)
      toast.error('❌ AI Gateway test failed')
    } finally {
      setTestLoading(false)
    }
  }

  const testStreamingGateway = async () => {
    setTestLoading(true)
    try {
      const response = await fetch('/api/generate-streaming', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: 'The future of artificial intelligence',
          type: 'blog'
        })
      })

      if (!response.ok) {
        throw new Error('Streaming test failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n').filter(line => line.trim())
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line)
              if (data.type === 'complete') {
                toast.success('✅ Streaming AI Gateway test successful!')
                break
              }
            } catch (e) {
              // Skip invalid JSON lines
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming test error:', error)
      toast.error('❌ Streaming Gateway test failed')
    } finally {
      setTestLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    )
  }

  const isEnabled = gatewayStats?.enabled || false

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">AI Gateway Status</h1>
        <p className="text-gray-300 mt-2">Monitor your Vercel AI Gateway integration and performance</p>
      </div>

      {/* Status Overview */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            {isEnabled ? <CheckCircle className="h-6 w-6 text-green-400" /> : <AlertCircle className="h-6 w-6 text-red-400" />}
            <span>AI Gateway Status</span>
          </CardTitle>
          <CardDescription className="text-gray-200">
            {isEnabled ? 'Vercel AI Gateway is active and enhancing your AI operations' : 'Vercel AI Gateway is not configured'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <Badge variant={isEnabled ? 'default' : 'destructive'} className={isEnabled ? 'bg-green-600' : 'bg-red-600'}>
              {isEnabled ? 'Enabled' : 'Disabled'}
            </Badge>
            {isEnabled && (
              <Badge variant="outline" className="border-purple-500 text-purple-400">
                Enhanced Mode
              </Badge>
            )}
          </div>
          
          {!isEnabled && (
            <Alert className="mt-4 bg-yellow-900/30 border-yellow-500/50">
              <AlertCircle className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                Configure AI_GATEWAY_URL and AI_GATEWAY_TOKEN in your environment variables to enable enhanced AI features
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Vercel Credits Counter */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-6 w-6 text-blue-400" />
              <span>Vercel Credits</span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchVercelCredits}
              disabled={creditsLoading}
              className="border-blue-500 text-blue-400 hover:bg-blue-900/30"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${creditsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </CardTitle>
          <CardDescription className="text-gray-200">
            Live credit information from your Vercel account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {creditsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : vercelCredits ? (
            <div className="space-y-4">
              {vercelCredits.success ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {typeof vercelCredits.credits.available === 'number' 
                          ? `$${vercelCredits.credits.available.toFixed(2)}`
                          : vercelCredits.credits.available}
                      </div>
                      <div className="text-gray-300 text-sm">Available Credits</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {typeof vercelCredits.credits.used === 'number' 
                          ? `$${vercelCredits.credits.used.toFixed(2)}`
                          : vercelCredits.credits.used}
                      </div>
                      <div className="text-gray-300 text-sm">Used Credits</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {vercelCredits.credits.status}
                      </div>
                      <div className="text-gray-300 text-sm">Account Status</div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-lg p-4">
                    <h4 className="text-white font-semibold mb-2">Account Information</h4>
                    <div className="text-sm text-gray-300 space-y-1">
                      <div><span className="font-medium">Name:</span> {vercelCredits.account.name}</div>
                      <div><span className="font-medium">Type:</span> {vercelCredits.account.type}</div>
                      {vercelCredits.account.email && (
                        <div><span className="font-medium">Email:</span> {vercelCredits.account.email}</div>
                      )}
                      {vercelCredits.usage?.projects && (
                        <div><span className="font-medium">Projects:</span> {vercelCredits.usage.projects}</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <Alert className="bg-red-900/30 border-red-500/50">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    <div className="font-semibold">Failed to fetch credit information</div>
                    <div className="text-sm mt-1">{vercelCredits.error}</div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              No credit information available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Features and Benefits */}
      {isEnabled && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Rocket className="h-6 w-6 text-purple-400" />
              <span>Available Features</span>
            </CardTitle>
            <CardDescription className="text-gray-200">
              Advanced features activated through Vercel AI Gateway
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {gatewayStats?.features.map((feature, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-800 rounded-lg">
                  <Zap className="h-5 w-5 text-yellow-400" />
                  <span className="text-gray-200">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Statistics */}
      {usage && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-blue-400" />
              <span>Usage Statistics</span>
            </CardTitle>
            <CardDescription className="text-gray-200">
              Current AI Gateway usage and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">{usage.totalTokens?.toLocaleString() || 0}</div>
                <div className="text-gray-300 text-sm">Total Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{usage.requests}</div>
                <div className="text-gray-300 text-sm">API Requests</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-400">
                  {usage.requests > 0 ? Math.round(usage.totalTokens! / usage.requests) : 0}
                </div>
                <div className="text-gray-300 text-sm">Avg Tokens/Request</div>
              </div>
            </div>
            
            <Separator className="my-6" />
            
            <div className="text-sm text-gray-400">
              Last request: {new Date(usage.lastUsed).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Testing Tools */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Cpu className="h-6 w-6 text-green-400" />
            <span>Gateway Testing</span>
          </CardTitle>
          <CardDescription className="text-gray-200">
            Test your AI Gateway integration and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Content Generation Test</h4>
              <p className="text-gray-300 text-sm mb-4">
                Test enhanced blog post generation through the AI Gateway
              </p>
              <Button 
                onClick={testAIGateway}
                disabled={testLoading || !isEnabled}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500"
              >
                {testLoading ? 'Testing...' : 'Test Content Generation'}
              </Button>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">Streaming Generation Test</h4>
              <p className="text-gray-300 text-sm mb-4">
                Test real-time streaming content generation (requires Gateway)
              </p>
              <Button 
                onClick={testStreamingGateway}
                disabled={testLoading || !isEnabled}
                variant="outline"
                className="border-blue-500 text-blue-400 hover:bg-blue-900/30"
              >
                {testLoading ? 'Testing...' : 'Test Streaming'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Why Use Vercel AI Gateway?</CardTitle>
          <CardDescription className="text-gray-200">
            Benefits of using Vercel AI Gateway in your application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold">Performance Optimization</h4>
                  <p className="text-gray-300 text-sm">Reduced latency and improved response times through caching and optimization</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold">Cost Management</h4>
                  <p className="text-gray-300 text-sm">Intelligent request routing and usage optimization to reduce costs</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold">Usage Analytics</h4>
                  <p className="text-gray-300 text-sm">Detailed metrics and insights into your AI usage patterns</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold">Enhanced Prompts</h4>
                  <p className="text-gray-300 text-sm">AI-powered prompt optimization for better content generation</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold">Reliability</h4>
                  <p className="text-gray-300 text-sm">Automatic failover and retry logic for improved reliability</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <CheckCircle className="h-5 w-5 text-green-400 mt-0.5" />
                <div>
                  <h4 className="text-white font-semibold">Rate Limiting</h4>
                  <p className="text-gray-300 text-sm">Intelligent rate limiting to prevent API quota exhaustion</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Help */}
      {!isEnabled && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Configuration Required</CardTitle>
            <CardDescription className="text-gray-200">
              Follow these steps to enable Vercel AI Gateway
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-800 rounded-lg p-4">
              <ol className="space-y-2 text-gray-300">
                <li>1. Add your Vercel AI Gateway URL to your environment variables</li>
                <li>2. Add your AI Gateway Token to your environment variables</li>
                <li>3. Ensure you have credits loaded in your Vercel AI account</li>
                <li>4. Restart your development server</li>
              </ol>
              
              <div className="mt-4 p-3 bg-gray-700 rounded">
                <code className="text-green-400 text-sm">
                  AI_GATEWAY_URL=your_gateway_url<br />
                  AI_GATEWAY_TOKEN=your_gateway_token
                </code>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
