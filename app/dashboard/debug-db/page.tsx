'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function DebugDatabasePage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/debug/supabase-connection')
      const data = await response.json()
      setResults(data)
    } catch (error) {
      console.error('Error running diagnostics:', error)
      setResults({ error: 'Failed to run diagnostics' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Database Connection Diagnostics</h1>
          <p className="text-gray-400">Check Supabase connection and database status</p>
        </div>
        <Button onClick={runDiagnostics} disabled={loading}>
          {loading ? '🔄 Running...' : '🔍 Run Diagnostics'}
        </Button>
      </div>

      {results && (
        <div className="space-y-6">
          {/* Timestamp */}
          <Card className="bg-white/5 border-purple-500/30">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Last Check:</span>
                <span className="text-white font-mono">{results.timestamp}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-400">Environment:</span>
                <Badge variant="secondary">{results.environment}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* All Checks */}
          {results.checks?.map((check: any, index: number) => (
            <Card key={index} className="bg-white/5 border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span>{check.name}</span>
                  <Badge 
                    variant={check.status.includes('✅') ? 'default' : 'destructive'}
                    className={check.status.includes('✅') ? 'bg-green-600' : 'bg-red-600'}
                  >
                    {check.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {/* Environment Variables Details */}
                {check.details && (
                  <div className="space-y-2">
                    {Object.entries(check.details).map(([key, value]) => (
                      <div key={key} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{key}:</span>
                        <span className={`font-mono ${String(value).includes('✅') ? 'text-green-400' : String(value).includes('❌') ? 'text-red-400' : 'text-gray-300'}`}>
                          {String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Table Checks */}
                {check.tables && (
                  <div className="space-y-2">
                    {check.tables.map((table: any, tIndex: number) => (
                      <div key={tIndex} className="bg-black/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-white font-semibold">{table.table}</span>
                          <Badge 
                            variant={table.status.includes('✅') ? 'default' : 'destructive'}
                            className={table.status.includes('✅') ? 'bg-green-600' : 'bg-red-600'}
                          >
                            {table.status}
                          </Badge>
                        </div>
                        {table.count !== undefined && (
                          <div className="text-sm text-gray-400">
                            Rows: {table.count}
                          </div>
                        )}
                        {table.error && (
                          <div className="text-sm text-red-400 mt-1">
                            Error: {table.error}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Error Messages */}
                {check.error && (
                  <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4 mt-4">
                    <p className="text-red-400 text-sm font-mono">{check.error}</p>
                  </div>
                )}

                {/* Other Data */}
                {check.hasSession !== undefined && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-400">Has Active Session:</span>
                      <Badge variant={check.hasSession ? 'default' : 'secondary'}>
                        {check.hasSession ? '✅ Yes' : '❌ No'}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!results && loading && (
        <Card className="bg-white/5 border-purple-500/30">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
                <p className="text-gray-300">Running diagnostics...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

