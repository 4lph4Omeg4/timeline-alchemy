import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Running database schema fix for social_connections...')

    // Try to query the social_connections table directly to check if columns exist
    const { data: testData, error: testError } = await supabaseAdmin
      .from('social_connections')
      .select('account_id, account_name')
      .limit(1)

    console.log('Test query result:', { testData, testError })

    if (testError) {
      console.error('Columns do not exist:', testError)
      return NextResponse.json({
        success: false,
        message: 'Database schema needs manual update. The account_id and account_name columns are missing.',
        details: {
          error: testError.message,
          suggestion: 'Please run the migration manually or add the columns via Supabase dashboard'
        }
      })
    }

    // If we get here, columns exist, so update existing records
    const { data: existingConnections, error: fetchError } = await supabaseAdmin
      .from('social_connections')
      .select('*')
      .is('account_id', null)

    if (fetchError) {
      console.error('Error fetching connections:', fetchError)
      return NextResponse.json({
        success: false,
        message: 'Error fetching existing connections',
        details: { error: fetchError.message }
      })
    }

    let updatedCount = 0
    if (existingConnections && existingConnections.length > 0) {
      console.log(`Found ${existingConnections.length} connections without account_id`)
      
      // Update each connection
      for (const connection of existingConnections) {
        const conn = connection as any
        const accountId = `${conn.platform}_${conn.platform_user_id || Date.now()}`
        const accountName = conn.platform === 'twitter' 
          ? `@${conn.platform_username || 'user'}`
          : conn.platform_username || `${conn.platform} Account`

        const { error: updateError } = await (supabaseAdmin as any)
          .from('social_connections')
          .update({
            account_id: accountId,
            account_name: accountName
          })
          .eq('id', conn.id)

        if (updateError) {
          console.error(`Error updating connection ${conn.id}:`, updateError)
        } else {
          console.log(`✅ Updated connection ${conn.id}`)
          updatedCount++
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database schema check completed',
      details: {
        columnsExist: true,
        updatedConnections: updatedCount,
        totalConnections: existingConnections?.length || 0
      }
    })

  } catch (error) {
    console.error('Database schema fix error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to check database schema',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
