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

    // Find the primary admin organization
    console.log('🔍 Looking for admin organization...')
    let { data: organization, error: orgError } = await supabaseClient
      .from('organizations')
      .select('id, name, type')
      .eq('type', 'admin')
      .limit(1)
      .single()
      
    console.log('🔍 Admin organization query result:', { organization, orgError })

    if (!organization?.id) {
      console.log('🔍 No admin org found, looking for any organization...')
      // Fallback: get any organization
      const fallbackResult = await supabaseClient
        .from('organizations')
        .select('id, name, type')
        .limit(1)
        .single()
        
      console.log('🔍 Fallback organization:', fallbackResult)
      
      if (!fallbackResult.data?.id) {
        console.error('❌ No organization found at all')
        return NextResponse.json(
          { error: 'No organization found' },
          { status: 400 }
        )
      }
      
      organization = fallbackResult.data
    }
    
    console.log('🔍 Using organization:', { id: organization.id, name: organization.name, type: organization.type })

    // Create the package (simplified - only basic fields)
    console.log('🔍 Creating package with simplified data:', {
      org_id: organization.id,
      title: title.substring(0, 50) + '...',
      contentLength: content.length,
      note: 'using only basic columns: title, content, state'
    })
    
    // Add admin marker to title
    const adminTitle = `[ADMIN] ${title}`
    
    const insertData = {
      org_id: organization.id,
      title: adminTitle,
      content: content,
      state: 'draft'
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
