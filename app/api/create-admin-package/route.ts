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

  // Strategy: Find any organization, prioritize admin type
  console.log('🔍 Looking for organizations...')
  
  // First try to find admin organization
  let { data: adminOrg, error: adminOrgError } = await supabaseClient
    .from('organizations')
    .select('id, name, type')
    .eq('type', 'admin')
    .limit(1)
    .single()
    
  console.log('🔍 Admin organization query result:', { adminOrg, adminOrgError })

  // If admin org exists, use it
  let organization = adminOrg
  
  // If no admin org, get ANY organization
  if (!organization?.id) {
    console.log('🔍 No admin org found, looking for any organization...')
    
    const { data: anyOrg, error: anyOrgError } = await supabaseClient
      .from('organizations')
      .select('id, name, type')
      .order('created_at', { ascending: true }) // Get oldest organization
      .limit(1)
      .single()
      
    console.log('🔍 Any organization result:', { anyOrg, anyOrgError })
    
    organization = anyOrg
  }
  
  // If still no organization, create a default one
  if (!organization?.id) {
    console.log('🔍 No organization exists, creating default admin organization...')
    
    const defaultOrgData = {
      name: 'System Admin Organization',
      type: 'admin',
      plan: 'enterprise'
    }
    
    const { data: newOrg, error: createError } = await supabaseClient
      .from('organizations')
      .insert(defaultOrgData)
      .select('id, name, type')
      .single()
      
    console.log('🔍 Created default organization:', { newOrg, createError })
    
    if (createError || !newOrg?.id) {
      console.error('❌ Failed to create default organization:', createError)
      return NextResponse.json(
        { error: 'Failed to find or create organization' },
        { status: 500 }
      )
    }
    
    organization = newOrg
    
    // Also create a subscription for this organization
    await supabaseClient
      .from('subscriptions')
      .insert({
        org_id: organization.id,
        stripe_customer_id: 'system-admin-' + organization.id,
        stripe_subscription_id: 'system-sub-' + organization.id,
        plan: 'enterprise',
        status: 'active'
      })
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
