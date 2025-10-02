import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('🔒 Enabling RLS for all tables...')

    // Enable RLS for all tables
    const tables = [
      'blog_posts',
      'clients', 
      'images',
      'org_members',
      'organizations',
      'social_connections',
      'subscriptions',
      'telegram_channels',
      'ratings',
      'social_posts'
    ]

    const results = []
    
    for (const table of tables) {
      try {
        // Check if table exists first
        const { data: tableExists } = await supabaseAdmin
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_name', table)
          .single()

        if (tableExists) {
          // Enable RLS for the table
          const { error } = await supabaseAdmin.rpc('exec_sql', {
            sql: `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;`
          })

          if (error) {
            console.error(`❌ Error enabling RLS for ${table}:`, error)
            results.push({ table, success: false, error: error.message })
          } else {
            console.log(`✅ Successfully enabled RLS for ${table}`)
            results.push({ table, success: true })
          }
        } else {
          console.log(`⚠️ Table ${table} does not exist, skipping...`)
          results.push({ table, success: false, error: 'Table does not exist' })
        }
      } catch (error) {
        console.error(`❌ Error processing table ${table}:`, error)
        results.push({ 
          table, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      success: true,
      message: `RLS enabled for ${successCount}/${totalCount} tables`,
      results
    })

  } catch (error) {
    console.error('❌ Error in enable-rls API:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
