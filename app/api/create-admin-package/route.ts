import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, content, excerpt, hashtags, suggestions, userId } = body

    console.log('🔍 Create admin package request:', {
      title: title,
      hasContent: !!content,
      contentLength: content?.length || 0,
      excerpt: excerpt,
      hasHashtags: !!hashtags,
      hashtagsCount: hashtags?.length || 0,
      userId: userId
    })
    
    // Check environment variables
    console.log('🔍 Environment check:', {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    })

    if (!title || !content) {
      console.error('❌ Missing required fields:', {
        title: title,
        sourceContent: content
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

  // Determine organization based on user role
  console.log('🔍 Determining organization for user:', userId || 'bulk-generator')
  
  let organization: { id: string; name: string; type: string } | null = null
  let isAdminUser = false
  
  if (userId) {
    // Check if this is the admin user
    const adminEmail = process.env.ADMIN_EMAIL || 'sh4m4ni4k@sh4m4ni4k.nl'
    
    // Get user details to check email
    const { data: userData, error: userError } = await supabaseClient.auth.admin.getUserById(userId)
    
    if (userData?.user?.email === adminEmail) {
      isAdminUser = true
      console.log('🔍 This is admin user, looking for admin organization...')
      
      // Admin: use admin org e6c0db74-03ee-4bb3-b08d-d94512efab91
      const { data: adminOrg, error: adminOrgError } = await supabaseClient
        .from('organizations')
        .select('id, name, type')
        .eq('id', 'e6c0db74-03ee-4bb3-b08d-d94512efab91')
        .single()
        
      console.log('🔍 Admin organization query result:', { adminOrg, adminOrgError })
      organization = adminOrg
      
      if (!organization?.id) {
        // Fallback: find admin organization by name
        const { data: fallbackOrg } = await supabaseClient
          .from('organizations')
          .select('id, name, type')
          .eq('name', 'Admin Organization')
          .single()
          
        organization = fallbackOrg
      }
    } else {
      // Client: find organization where user is owner
      console.log('🔍 This is client user, looking for user-owned organization...')
      
      const { data: userOrgs, error: userOrgsError } = await supabaseClient
        .from('org_members')
        .select('org_id, role, organizations(id, name, type)')
        .eq('user_id', userId)
        .eq('role', 'owner')
        .single()
        
      console.log('🔍 User organization query result:', { userOrgs, userOrgsError })
      
      if (userOrgs?.organizations && Array.isArray(userOrgs.organizations) && userOrgs.organizations[0]) {
        organization = userOrgs.organizations[0]
      } else if (userOrgs?.organizations && !Array.isArray(userOrgs.organizations)) {
        organization = userOrgs.organizations
      }
    }
  }
  
  // Fallback: if still no organization, find any usable one
  if (!organization?.id) {
    console.log('🔍 No specific organization found, using fallback strategy...')
    
    const { data: fallbackOrg } = await supabaseClient
      .from('organizations')
      .select('id, name, type')
      .order('created_at', { ascending: true })
      .limit(1)
      .single()
      
    organization = fallbackOrg
  }
  
  if (!organization?.id) {
    console.error('❌ No organization found at all')
    return NextResponse.json(
      { error: 'No organization found' },
      { status: 400 }
    )
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
