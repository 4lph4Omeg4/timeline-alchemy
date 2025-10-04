import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, excerpt, hashtags, suggestions } = body

    console.log('🔍 Create admin package request:', {
      title: title,
      hasContent: !!content,
      contentLength: content?.length || 0,
      excerpt: excerpt,
      hasHashtags: !!hashtags,
      hashtagsCount: hashtags?.length || 0
    })
    
    // Check environment variables
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    if (!title || !content) {
      console.error('❌ Missing required fields:', {
        title: title,
        content: content
      })
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
    console.log('🔍 Looking for organization...')
    const { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id')
      .limit(1)
      .single()
      
    console.log('🔍 Organization query result:', { organization, orgError })

    if (!organization?.id) {
      console.error('❌ No organization found')
      return NextResponse.json(
        { error: 'No organization found' },
        { status: 400 }
      )
    }
    
    console.log('🔍 Using organization ID:', organization.id)

    // Create the package
    console.log('🔍 Creating package with data:', {
      org_id: organization.id,
      title: title.substring(0, 50) + '...',
      contentLength: content.length,
      excerptLength: (excerpt || content.substring(0, 150) + '...').length,
      note: 'excerpt will be stored in metadata field'
    })
    
    const insertData = {
      org_id: organization.id,
      title: title,
      content: content,
      state: 'draft',
      created_by_admin: true,
      metadata: {
        hashtags: hashtags || [],
        suggestions: suggestions || [],
        excerpt: excerpt || content.substring(0, 150) + '...', // Store excerpt in metadata instead
        source: 'bulk_content_generator'
      }
    }
    
    const { data: packageData, error: packageError } = await supabaseClient
      .from('blog_posts')
      .insert(insertData)
      .select()
      .single()

    if (packageError) {
      console.error('❌ Error creating package:', packageError)
      console.error('❌ Insert data:', insertData)
      return NextResponse.json(
        { error: 'Failed to create package', details: packageError.message },
        { status: 500 }
      )
    }
    
    console.log('✅ Package created successfully:', packageData)

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
