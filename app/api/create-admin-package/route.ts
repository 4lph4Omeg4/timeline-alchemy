import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { title, content, excerpt, hashtags, suggestions } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      )
    }

    // Get the current user
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      )
    }

    const supabaseClient = supabase
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get admin's organization
    const { data: orgMember, error: orgError } = await supabaseClient
      .from('org_members')
      .select('org_id')
      .eq('user_id', user.id)
      .eq('role', 'owner')
      .single()

    if (orgError || !orgMember) {
      return NextResponse.json(
        { error: 'Admin organization not found' },
        { status: 403 }
      )
    }

    // Create the package
    const { data: packageData, error: packageError } = await supabaseClient
      .from('blog_posts')
      .insert({
        org_id: orgMember.org_id,
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
