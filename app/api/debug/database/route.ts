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

export async function GET() {
  try {
    // Check if blog_posts table has the new columns
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'blog_posts')
      .in('column_name', ['client_id', 'created_by_admin'])

    // Check if user_clients table exists
    const { data: userClientsTable, error: userClientsError } = await supabaseAdmin
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'user_clients')

    // Check RLS policies
    const { data: policies, error: policiesError } = await supabaseAdmin
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'user_clients')

    // Test basic queries
    const { data: testClients, error: clientsError } = await supabaseAdmin
      .from('clients')
      .select('count(*)')
      .limit(1)

    const { data: testPosts, error: postsError } = await supabaseAdmin
      .from('blog_posts')
      .select('count(*)')
      .limit(1)

    const { data: testUserClients, error: userClientsQueryError } = await supabaseAdmin
      .from('user_clients')
      .select('count(*)')
      .limit(1)

    return NextResponse.json({
      migrations: {
        blog_posts_columns: {
          data: tableInfo,
          error: tableError,
          has_client_id: tableInfo?.some(col => col.column_name === 'client_id'),
          has_created_by_admin: tableInfo?.some(col => col.column_name === 'created_by_admin')
        },
        user_clients_table: {
          exists: userClientsTable && userClientsTable.length > 0,
          error: userClientsError
        },
        user_clients_policies: {
          data: policies,
          error: policiesError,
          count: policies?.length || 0
        }
      },
      data_counts: {
        clients: { data: testClients, error: clientsError },
        blog_posts: { data: testPosts, error: postsError },
        user_clients: { data: testUserClients, error: userClientsQueryError }
      }
    })
  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json(
      { error: 'Database debug failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
