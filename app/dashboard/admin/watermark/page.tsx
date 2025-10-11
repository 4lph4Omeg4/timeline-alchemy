'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import toast from 'react-hot-toast'

interface ProcessResult {
  id: string
  status: string
  newUrl?: string
  error?: string
}

interface BulkWatermarkStats {
  total: number
  processed: number
  skipped: number
  failed: number
}

export default function BulkWatermarkPage() {
  const [processing, setProcessing] = useState(false)
  const [stats, setStats] = useState<BulkWatermarkStats | null>(null)
  const [results, setResults] = useState<ProcessResult[]>([])

  const handleApplyWatermarks = async () => {
    if (!confirm('Are you sure you want to apply watermarks to all existing images? This may take several minutes.')) {
      return
    }

    setProcessing(true)
    setStats(null)
    setResults([])

    try {
      toast.loading('Processing images...', { id: 'watermark-process' })
      
      const response = await fetch('/api/watermark-simple', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to process images')
      }

      const data = await response.json()
      
      setStats(data.stats)
      setResults(data.results || [])
      
      toast.success(`Successfully processed ${data.stats.processed} images!`, { id: 'watermark-process' })
      
    } catch (error) {
      console.error('Error applying watermarks:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to process images', { id: 'watermark-process' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Bulk Watermark Application</h1>
        <p className="text-gray-400">Apply Timeline Alchemy watermark to all existing images</p>
      </div>

      <Card className="bg-white/5 border-purple-500/30 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Apply Watermarks</CardTitle>
          <CardDescription className="text-gray-300">
            This will apply the Admin Organization's branding watermark to all images that don't already have one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-yellow-200 text-sm">
                ⚠️ <strong>Important:</strong> This process will:
              </p>
              <ul className="list-disc list-inside text-yellow-200 text-sm mt-2 space-y-1">
                <li>Download each image from Supabase Storage</li>
                <li>Apply the Timeline Alchemy logo watermark</li>
                <li>Upload the watermarked version to Supabase Storage</li>
                <li>Update the database with new URLs</li>
                <li>Skip images that are already watermarked</li>
              </ul>
              <p className="text-yellow-200 text-sm mt-2">
                This may take several minutes depending on the number of images.
              </p>
            </div>

            <Button 
              onClick={handleApplyWatermarks}
              disabled={processing}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {processing ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Processing...
                </>
              ) : (
                '🎨 Apply Watermarks to All Images'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Display */}
      {stats && (
        <Card className="bg-white/5 border-purple-500/30 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Processing Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="text-2xl font-bold text-white">{stats.total}</div>
                <div className="text-sm text-gray-400">Total Images</div>
              </div>
              
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400">{stats.processed}</div>
                <div className="text-sm text-green-300">Processed</div>
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-yellow-400">{stats.skipped}</div>
                <div className="text-sm text-yellow-300">Skipped</div>
              </div>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-400">{stats.failed}</div>
                <div className="text-sm text-red-300">Failed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Results */}
      {results.length > 0 && (
        <Card className="bg-white/5 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white">Detailed Results</CardTitle>
            <CardDescription className="text-gray-300">
              Individual image processing status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={result.id} 
                  className="bg-white/5 rounded-lg p-3 flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <Badge 
                      variant={
                        result.status === 'processed' ? 'default' : 
                        result.status === 'skipped' ? 'secondary' : 
                        'destructive'
                      }
                      className={
                        result.status === 'processed' ? 'bg-green-600' : 
                        result.status === 'skipped' ? 'bg-yellow-600' : 
                        'bg-red-600'
                      }
                    >
                      {result.status === 'processed' ? '✅' : 
                       result.status === 'skipped' ? '⏭️' : 
                       '❌'} {result.status}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-400 truncate">
                        ID: {result.id}
                      </div>
                      {result.newUrl && (
                        <div className="text-xs text-purple-300 truncate">
                          {result.newUrl}
                        </div>
                      )}
                      {result.error && (
                        <div className="text-xs text-red-300 truncate">
                          Error: {result.error}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

