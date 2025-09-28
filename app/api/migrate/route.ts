import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST() {
  try {
    const results: any = {}

    // Test if columns already exist by trying to select them
    const { data: testData, error: testError } = await supabaseAdmin
      .from('blog_posts')
      .select('client_id, created_by_admin')
      .limit(1)

    if (testError && testError.message.includes('column') && testError.message.includes('does not exist')) {
      // Columns don't exist, we need to add them manually
      results.status = 'Columns need to be added manually'
      results.message = 'Please run the SQL commands manually in Supabase SQL Editor'
      results.sql_commands = [
        'ALTER TABLE blog_posts ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;',
        'ALTER TABLE blog_posts ADD COLUMN created_by_admin BOOLEAN DEFAULT FALSE;',
        'ALTER TABLE images ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;',
        'CREATE INDEX idx_blog_posts_client_id ON blog_posts(client_id);',
        'CREATE INDEX idx_blog_posts_created_by_admin ON blog_posts(created_by_admin);',
        'CREATE INDEX idx_images_client_id ON images(client_id);',
        'ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;',
        'CREATE POLICY "Users can view their own client relationships" ON user_clients FOR SELECT USING (user_id = auth.uid());',
        'CREATE POLICY "Users can create their own client relationships" ON user_clients FOR INSERT WITH CHECK (user_id = auth.uid());',
        'CREATE POLICY "Users can update their own client relationships" ON user_clients FOR UPDATE USING (user_id = auth.uid());',
        'CREATE POLICY "Users can delete their own client relationships" ON user_clients FOR DELETE USING (user_id = auth.uid());',
        `CREATE POLICY "Organization owners can manage client relationships" ON user_clients FOR ALL USING (
          client_id IN (
            SELECT c.id FROM clients c
            INNER JOIN org_members om ON c.org_id = om.org_id
            WHERE om.user_id = auth.uid() AND om.role = 'owner'
          )
        );`
      ]
    } else if (!testError) {
      // Columns exist, test if they work
      results.status = 'Columns already exist'
      results.message = 'Database structure is ready'
      results.test_data = testData
    } else {
      // Other error
      results.status = 'Unknown error'
      results.error = testError.message
    }

    return NextResponse.json({
      success: true,
      message: 'Migration check completed',
      results
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed', 
        details: error instanceof Error ? error.message : String(error) 
      },
      { status: 500 }
    )
  }
}
