import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    console.log('Running database schema fix for social_connections...')

    // Add account_id column if it doesn't exist
    const { error: addAccountIdError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE social_connections 
        ADD COLUMN IF NOT EXISTS account_id VARCHAR(255);
      `
    })

    if (addAccountIdError) {
      console.error('Error adding account_id column:', addAccountIdError)
    } else {
      console.log('✅ Added account_id column')
    }

    // Add account_name column if it doesn't exist
    const { error: addAccountNameError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE social_connections 
        ADD COLUMN IF NOT EXISTS account_name VARCHAR(255);
      `
    })

    if (addAccountNameError) {
      console.error('Error adding account_name column:', addAccountNameError)
    } else {
      console.log('✅ Added account_name column')
    }

    // Drop old unique constraint if it exists
    const { error: dropConstraintError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE social_connections 
        DROP CONSTRAINT IF EXISTS social_connections_org_id_platform_key;
      `
    })

    if (dropConstraintError) {
      console.error('Error dropping old constraint:', dropConstraintError)
    } else {
      console.log('✅ Dropped old unique constraint')
    }

    // Add new unique constraint
    const { error: addConstraintError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE social_connections 
        ADD CONSTRAINT social_connections_org_platform_account_unique 
        UNIQUE (org_id, platform, account_id);
      `
    })

    if (addConstraintError) {
      console.error('Error adding new constraint:', addConstraintError)
    } else {
      console.log('✅ Added new unique constraint')
    }

    // Update existing records to have account_id
    const { error: updateRecordsError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        UPDATE social_connections 
        SET account_id = platform || '_' || EXTRACT(EPOCH FROM created_at)::text
        WHERE account_id IS NULL;
      `
    })

    if (updateRecordsError) {
      console.error('Error updating existing records:', updateRecordsError)
    } else {
      console.log('✅ Updated existing records with account_id')
    }

    // Update account_name for existing records
    const { error: updateNamesError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        UPDATE social_connections 
        SET account_name = CASE 
          WHEN platform = 'twitter' THEN 'Twitter Account'
          WHEN platform = 'linkedin' THEN 'LinkedIn Account'
          ELSE platform || ' Account'
        END
        WHERE account_name IS NULL;
      `
    })

    if (updateNamesError) {
      console.error('Error updating account names:', updateNamesError)
    } else {
      console.log('✅ Updated account names')
    }

    // Make account_id NOT NULL
    const { error: makeNotNullError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE social_connections 
        ALTER COLUMN account_id SET NOT NULL;
      `
    })

    if (makeNotNullError) {
      console.error('Error making account_id NOT NULL:', makeNotNullError)
    } else {
      console.log('✅ Made account_id NOT NULL')
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database schema updated successfully' 
    })

  } catch (error) {
    console.error('Database schema fix error:', error)
    return NextResponse.json(
      { error: 'Failed to update database schema' },
      { status: 500 }
    )
  }
}
