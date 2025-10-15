'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/Loader'
import toast from 'react-hot-toast'

export default function FixClientAccessPage() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleFixClientAccess = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/fix-client-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fix client access')
      }

      setResult(data)
      toast.success('Client access fixed successfully!')
    } catch (error) {
      console.error('Error fixing client access:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to fix client access')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Fix Member Access</h1>
        <p className="text-gray-300 mt-2">
          This tool ensures all users have access to the admin organization for global package access.
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">member Access Fix</CardTitle>
          <CardDescription className="text-gray-300">
            This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Ensure Admin Organization exists</li>
              <li>Add all users to Admin Organization (admin as owner, others as member)</li>
              <li>Create admin subscription</li>
              <li>Move all members to Admin Organization</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleFixClientAccess}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Fixing Member Access...
              </>
            ) : (
              'Fix Member Access'
            )}
          </Button>

          {result && (
            <div className="mt-4 p-4 bg-green-900 border border-green-700 rounded-lg">
              <h3 className="text-green-400 font-semibold mb-2">Success!</h3>
              <div className="text-sm text-green-300 space-y-1">
                <p>Admin Organization ID: {result.adminOrgId}</p>
                <p>Users added: {result.usersAdded}</p>
                <p className="text-green-400 font-medium">{result.message}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
