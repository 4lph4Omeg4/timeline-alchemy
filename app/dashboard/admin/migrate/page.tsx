'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader } from '@/components/Loader'
import toast from 'react-hot-toast'

export default function MigratePage() {
  const [migrating, setMigrating] = useState(false)
  const [results, setResults] = useState<any>(null)

  const runMigrations = async () => {
    setMigrating(true)
    try {
      // Run the migrations via API
      const response = await fetch('/api/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()
      
      if (response.ok) {
        setResults(data)
        toast.success('Migrations completed successfully!')
      } else {
        toast.error(data.error || 'Migration failed')
        setResults(data)
      }
    } catch (error) {
      console.error('Migration error:', error)
      toast.error('Migration failed')
    } finally {
      setMigrating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Database Migrations</h1>
        <p className="text-gray-300 mt-2">
          Run database migrations to add client package support.
        </p>
      </div>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Run Migrations</CardTitle>
          <CardDescription className="text-gray-300">
            This will add the necessary columns and tables for client packages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-900 border border-yellow-600 rounded-lg p-4">
            <h4 className="text-yellow-200 font-medium mb-2">⚠️ Important</h4>
            <p className="text-yellow-100 text-sm">
              This will modify your database structure. Make sure you have a backup if needed.
            </p>
          </div>

          <Button 
            onClick={runMigrations}
            disabled={migrating}
            className="w-full"
          >
            {migrating ? (
              <>
                <Loader className="mr-2 h-4 w-4" />
                Running Migrations...
              </>
            ) : (
              'Run Database Migrations'
            )}
          </Button>

          {results && (
            <div className="mt-4">
              <h4 className="text-white font-medium mb-2">Migration Results:</h4>
              <pre className="text-gray-300 text-sm bg-gray-800 p-4 rounded-lg overflow-auto max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Manual Migration</CardTitle>
          <CardDescription className="text-gray-300">
            If the automatic migration fails, run this SQL in Supabase SQL Editor:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="text-gray-300 text-sm bg-gray-800 p-4 rounded-lg overflow-auto">
{`-- Add client_id to blog_posts table for admin-created packages
ALTER TABLE blog_posts ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
ALTER TABLE blog_posts ADD COLUMN created_by_admin BOOLEAN DEFAULT FALSE;

-- Add client_id to images table for admin-created packages
ALTER TABLE images ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;

-- Create index for better performance
CREATE INDEX idx_blog_posts_client_id ON blog_posts(client_id);
CREATE INDEX idx_blog_posts_created_by_admin ON blog_posts(created_by_admin);
CREATE INDEX idx_images_client_id ON images(client_id);

-- Add RLS policies for user_clients table
ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;

-- Users can view their own client relationships
CREATE POLICY "Users can view their own client relationships" ON user_clients
  FOR SELECT USING (user_id = auth.uid());

-- Users can create their own client relationships
CREATE POLICY "Users can create their own client relationships" ON user_clients
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own client relationships
CREATE POLICY "Users can update their own client relationships" ON user_clients
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own client relationships
CREATE POLICY "Users can delete their own client relationships" ON user_clients
  FOR DELETE USING (user_id = auth.uid());

-- Organization owners can manage client relationships for their organization
CREATE POLICY "Organization owners can manage client relationships" ON user_clients
  FOR ALL USING (
    client_id IN (
      SELECT c.id FROM clients c
      INNER JOIN org_members om ON c.org_id = om.org_id
      WHERE om.user_id = auth.uid() AND om.role = 'owner'
    )
  );`}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}
