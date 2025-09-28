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

    // 1. Add client_id column to blog_posts
    try {
      const { error: clientIdError } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;'
      })
      results.client_id_column = clientIdError ? { error: clientIdError.message } : { success: true }
    } catch (error) {
      results.client_id_column = { error: error instanceof Error ? error.message : String(error) }
    }

    // 2. Add created_by_admin column to blog_posts
    try {
      const { error: createdByAdminError } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS created_by_admin BOOLEAN DEFAULT FALSE;'
      })
      results.created_by_admin_column = createdByAdminError ? { error: createdByAdminError.message } : { success: true }
    } catch (error) {
      results.created_by_admin_column = { error: error instanceof Error ? error.message : String(error) }
    }

    // 3. Add client_id column to images
    try {
      const { error: imagesClientIdError } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE images ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES clients(id) ON DELETE CASCADE;'
      })
      results.images_client_id_column = imagesClientIdError ? { error: imagesClientIdError.message } : { success: true }
    } catch (error) {
      results.images_client_id_column = { error: error instanceof Error ? error.message : String(error) }
    }

    // 4. Create indexes
    try {
      const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_blog_posts_client_id ON blog_posts(client_id);
          CREATE INDEX IF NOT EXISTS idx_blog_posts_created_by_admin ON blog_posts(created_by_admin);
          CREATE INDEX IF NOT EXISTS idx_images_client_id ON images(client_id);
        `
      })
      results.indexes = indexError ? { error: indexError.message } : { success: true }
    } catch (error) {
      results.indexes = { error: error instanceof Error ? error.message : String(error) }
    }

    // 5. Enable RLS on user_clients
    try {
      const { error: rlsError } = await supabaseAdmin.rpc('exec_sql', {
        sql: 'ALTER TABLE user_clients ENABLE ROW LEVEL SECURITY;'
      })
      results.user_clients_rls = rlsError ? { error: rlsError.message } : { success: true }
    } catch (error) {
      results.user_clients_rls = { error: error instanceof Error ? error.message : String(error) }
    }

    // 6. Create RLS policies
    const policies = [
      'CREATE POLICY IF NOT EXISTS "Users can view their own client relationships" ON user_clients FOR SELECT USING (user_id = auth.uid());',
      'CREATE POLICY IF NOT EXISTS "Users can create their own client relationships" ON user_clients FOR INSERT WITH CHECK (user_id = auth.uid());',
      'CREATE POLICY IF NOT EXISTS "Users can update their own client relationships" ON user_clients FOR UPDATE USING (user_id = auth.uid());',
      'CREATE POLICY IF NOT EXISTS "Users can delete their own client relationships" ON user_clients FOR DELETE USING (user_id = auth.uid());',
      `CREATE POLICY IF NOT EXISTS "Organization owners can manage client relationships" ON user_clients FOR ALL USING (
        client_id IN (
          SELECT c.id FROM clients c
          INNER JOIN org_members om ON c.org_id = om.org_id
          WHERE om.user_id = auth.uid() AND om.role = 'owner'
        )
      );`
    ]

    results.policies = {}
    for (let i = 0; i < policies.length; i++) {
      try {
        const { error: policyError } = await supabaseAdmin.rpc('exec_sql', {
          sql: policies[i]
        })
        results.policies[`policy_${i + 1}`] = policyError ? { error: policyError.message } : { success: true }
      } catch (error) {
        results.policies[`policy_${i + 1}`] = { error: error instanceof Error ? error.message : String(error) }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Migration completed',
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
