import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Running database schema fix for social_connections...')

    // Check current schema
    const { data: columns, error: columnsError } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'social_connections')
      .eq('table_schema', 'public')

    if (columnsError) {
      console.error('Error checking columns:', columnsError)
      return NextResponse.json(
        { error: 'Failed to check database schema' },
        { status: 500 }
      )
    }

    const columnNames = columns?.map((col: any) => col.column_name) || []
    console.log('Current columns:', columnNames)

    // Check if account_id exists
    const hasAccountId = columnNames.includes('account_id')
    const hasAccountName = columnNames.includes('account_name')

    console.log('Schema status:', { hasAccountId, hasAccountName })

    // If columns don't exist, we need to add them manually
    if (!hasAccountId || !hasAccountName) {
      return NextResponse.json({
        success: false,
        message: 'Database schema needs manual update. Please run the migration manually.',
        details: {
          hasAccountId,
          hasAccountName,
          requiredColumns: ['account_id', 'account_name']
        }
      })
    }

    // Update existing records to have account_id if they don't
    const { data: existingConnections, error: fetchError } = await supabaseAdmin
      .from('social_connections')
      .select('*')
      .is('account_id', null)

    if (fetchError) {
      console.error('Error fetching connections:', fetchError)
    } else if (existingConnections && existingConnections.length > 0) {
      console.log(`Found ${existingConnections.length} connections without account_id`)
      
      // Update each connection
      for (const connection of existingConnections) {
        const conn = connection as any
        const accountId = `${conn.platform}_${conn.platform_user_id || Date.now()}`
        const accountName = conn.platform === 'twitter' 
          ? `@${conn.platform_username || 'user'}`
          : conn.platform_username || `${conn.platform} Account`

        const { error: updateError } = await supabaseAdmin
          .from('social_connections')
          .update({
            account_id: accountId,
            account_name: accountName
          } as any)
          .eq('id', conn.id)

        if (updateError) {
          console.error(`Error updating connection ${conn.id}:`, updateError)
        } else {
          console.log(`✅ Updated connection ${conn.id}`)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database schema check completed',
      details: {
        hasAccountId,
        hasAccountName,
        updatedConnections: existingConnections?.length || 0
      }
    })

  } catch (error) {
    console.error('Database schema fix error:', error)
    return NextResponse.json(
      { error: 'Failed to check database schema' },
      { status: 500 }
    )
  }
}
