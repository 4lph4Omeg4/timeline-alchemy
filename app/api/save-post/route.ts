import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { checkPlanLimits, incrementUsage } from '@/lib/subscription-limits'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { title, content, socialPosts, generatedImages, userId } = body

        if (!title || !content || !userId) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Use service role key for server-side operations
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        })

        // Get user's organization
        const { data: orgMembers, error: orgError } = await supabaseAdmin
            .from('org_members')
            .select('org_id, role')
            .eq('user_id', userId)

        if (orgError || !orgMembers || orgMembers.length === 0) {
            return NextResponse.json(
                { error: 'No organization found for user' },
                { status: 400 }
            )
        }

        // Prioritize non-client roles (owner, admin, member)
        let userOrgId = orgMembers.find(member => member.role !== 'client')?.org_id
        if (!userOrgId) {
            userOrgId = orgMembers[0].org_id
        }

        console.log('🔍 Checking limits for org:', userOrgId)

        // Check subscription limits
        const limitResult = await checkPlanLimits(userOrgId, 'contentPackage')

        if (!limitResult.allowed) {
            console.log('❌ Limit check failed:', limitResult.reason)
            return NextResponse.json(
                { error: limitResult.reason || 'Plan limit reached' },
                { status: 403 }
            )
        }

        console.log('✅ Limit check passed')

        // Create the post
        const { data: insertedPackage, error: packageError } = await supabaseAdmin
            .from('blog_posts')
            .insert({
                org_id: userOrgId,
                created_by_user_id: userId,
                title: title,
                content: content,
                social_posts: socialPosts || {},
                state: 'draft', // Default to draft for user created posts
                created_by_admin: false,
            })
            .select()
            .single()

        if (packageError) {
            console.error('❌ Save post error:', packageError)
            return NextResponse.json(
                { error: 'Failed to save post', details: packageError.message },
                { status: 500 }
            )
        }

        console.log('✅ Post created successfully:', insertedPackage.id)

        // Save social posts to separate table
        if (socialPosts && Object.keys(socialPosts).length > 0) {
            for (const [platform, socialContent] of Object.entries(socialPosts)) {
                await supabaseAdmin
                    .from('social_posts')
                    .insert({
                        post_id: insertedPackage.id,
                        platform,
                        content: socialContent
                    })
            }
        }

        // Save images permanently
        if (generatedImages && Array.isArray(generatedImages) && generatedImages.length > 0) {
            try {
                const imagesToInsert = generatedImages.map((img: any, index: number) => ({
                    org_id: userOrgId,
                    post_id: insertedPackage.id,
                    url: img.url,
                    prompt: img.prompt,
                    style: img.style || 'photorealistic',
                    variant_type: img.variantType || 'original',
                    is_active: img.isActive !== undefined ? img.isActive : true,
                    prompt_number: img.promptNumber || (index + 1),
                    style_group: img.styleGroup || crypto.randomUUID()
                }))

                const { error: dbError } = await supabaseAdmin
                    .from('images')
                    .insert(imagesToInsert)

                if (dbError) {
                    console.error('❌ Database error saving images:', dbError)
                } else {
                    console.log(`✅ ${imagesToInsert.length} images saved to database`)
                }
            } catch (imageError) {
                console.error('❌ Error saving images permanently:', imageError)
            }
        }

        // Increment usage counter
        try {
            await incrementUsage(userOrgId, 'contentPackage')
            console.log(`📊 Incremented content package usage for org: ${userOrgId}`)
        } catch (usageError) {
            console.error('❌ Failed to increment usage:', usageError)
        }

        return NextResponse.json({
            success: true,
            post: insertedPackage,
            message: 'Post saved successfully'
        })

    } catch (error) {
        console.error('❌ Save post error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
