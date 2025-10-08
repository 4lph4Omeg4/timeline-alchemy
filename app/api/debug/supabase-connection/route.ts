import { NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const results: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: []
  }

  // Check 1: Environment Variables
  results.checks.push({
    name: 'Environment Variables',
    status: 'checking',
    details: {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing',
      urlValue: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
    }
  })

  // Check 2: Client Connection
  try {
    const { data, error } = await supabase.from('organizations').select('count').limit(1)
    
    results.checks.push({
      name: 'Supabase Client Connection',
      status: error ? '❌ Failed' : '✅ Success',
      error: error?.message,
      data: data
    })
  } catch (error) {
    results.checks.push({
      name: 'Supabase Client Connection',
      status: '❌ Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 3: Admin Connection
  try {
    const { data, error } = await supabaseAdmin.from('organizations').select('count').limit(1)
    
    results.checks.push({
      name: 'Supabase Admin Connection',
      status: error ? '❌ Failed' : '✅ Success',
      error: error?.message,
      data: data
    })
  } catch (error) {
    results.checks.push({
      name: 'Supabase Admin Connection',
      status: '❌ Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 4: Database Tables
  try {
    const tables = ['organizations', 'org_members', 'blog_posts', 'images', 'subscriptions', 'branding_settings']
    const tableChecks = []

    for (const table of tables) {
      try {
        const { count, error } = await supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
        tableChecks.push({
          table,
          status: error ? '❌ Error' : '✅ Accessible',
          count: count ?? 'unknown',
          error: error?.message
        })
      } catch (err) {
        tableChecks.push({
          table,
          status: '❌ Error',
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    results.checks.push({
      name: 'Database Tables',
      status: '✅ Checked',
      tables: tableChecks
    })
  } catch (error) {
    results.checks.push({
      name: 'Database Tables',
      status: '❌ Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  // Check 5: Auth Status
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    results.checks.push({
      name: 'Auth Session',
      status: '✅ Checked',
      hasSession: !!session,
      error: error?.message
    })
  } catch (error) {
    results.checks.push({
      name: 'Auth Session',
      status: '❌ Error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }

  return NextResponse.json(results, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

