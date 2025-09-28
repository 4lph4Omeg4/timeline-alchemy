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
    // Test if the new columns exist by trying to select them
    const { data: testData, error: testError } = await supabaseAdmin
      .from('blog_posts')
      .select('id, title, client_id, created_by_admin')
      .limit(1)

    if (testError) {
      return NextResponse.json({
        columnsExist: false,
        error: testError.message,
        suggestion: 'Run the database migrations first'
      })
    }

    return NextResponse.json({
      columnsExist: true,
      testData,
      message: 'Columns exist and are accessible'
    })
  } catch (error) {
    return NextResponse.json({
      columnsExist: false,
      error: error instanceof Error ? error.message : String(error),
      suggestion: 'Run the database migrations first'
    })
  }
}
