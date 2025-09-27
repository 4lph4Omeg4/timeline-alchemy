import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Execute SQL to disable RLS and drop problematic policies
    const sql = `
      -- Disable RLS on problematic tables
      ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
      ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
      ALTER TABLE clients DISABLE ROW LEVEL SECURITY;
      ALTER TABLE user_clients DISABLE ROW LEVEL SECURITY;
      ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;
      ALTER TABLE images DISABLE ROW LEVEL SECURITY;
      ALTER TABLE social_connections DISABLE ROW LEVEL SECURITY;
      ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
    `

    const { data, error } = await (supabase as any).rpc('exec_sql', { sql })

    if (error) {
      console.error('Error executing SQL:', error)
      return NextResponse.json({ error: 'Failed to execute SQL' }, { status: 500 })
    }

    return NextResponse.json({ 
      message: 'RLS policies disabled successfully',
      data 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: 'Failed to disable RLS policies' },
      { status: 500 }
    )
  }
}
