import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const { title, content, excerpt, hashtags, suggestions } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Use service role key for server-side operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // For now, we'll create packages without user authentication
    // In production, you'd want to validate the user session
    const { data: organization } = await supabaseClient
      .from('organizations')
      .select('id')
      .limit(1)
      .single()

    if (!organization?.id) {
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }

    // Create the package
    const { data: packageData, error: packageError } = await supabaseClient
      .from('blog_posts')
      .insert({
        org_id: organization.id,
        title: title,
        content: content,
        excerpt: excerpt || content.substring(0, 150) + '...',
        state: 'draft',
        created_by_admin: true,
        metadata: {
          hashtags: hashtags || [],
          suggestions: suggestions || [],
          source: 'bulk_content_generator'
        }
      })
      .select()
      .single()

    if (packageError) {
      console.error('Error creating package:', packageError)
      return NextResponse.json(
        { error: 'Failed to create package' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      package: packageData,
      message: 'Package created successfully'
    })

  } catch (error) {
    console.error('Create admin package error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
