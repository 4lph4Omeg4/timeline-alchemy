import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { BrandingSettings } from '@/types/index'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orgId = searchParams.get('orgId')

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    const { data: branding, error } = await (supabaseAdmin as any)
      .from('branding_settings')
      .select('*')
      .eq('organization_id', orgId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching branding settings:', error)
      return NextResponse.json({ error: 'Failed to fetch branding settings' }, { status: 500 })
    }

    // If no branding settings exist, return default values
    if (!branding) {
      return NextResponse.json({
        id: null,
        organization_id: orgId,
        logo_url: null,
        logo_position: 'bottom-right',
        logo_opacity: 0.7,
        logo_size: 0.1,
        enabled: true
      })
    }

    return NextResponse.json(branding)
  } catch (error) {
    console.error('Error in branding GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('📦 Branding POST request body:', JSON.stringify(body, null, 2))
    
    const { organization_id, org_id, logo_url, logo_position, logo_opacity, logo_size, enabled } = body
    
    // Support both org_id and organization_id for compatibility
    const orgId = organization_id || org_id

    console.log('🔑 Resolved orgId:', orgId)

    if (!orgId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
    }

    // Check if branding settings already exist
    const { data: existing, error: checkError } = await (supabaseAdmin as any)
      .from('branding_settings')
      .select('id')
      .eq('organization_id', orgId)
      .single()
    
    // Log any error during check (but don't fail if it's just "not found")
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing branding:', checkError)
    }

    let result
    if (existing) {
      console.log('✏️ Updating existing branding settings for org:', orgId)
      // Update existing settings
      const { data, error } = await (supabaseAdmin as any)
        .from('branding_settings')
        .update({
          logo_url,
          logo_position: logo_position || 'bottom-right',
          logo_opacity: logo_opacity || 0.7,
          logo_size: logo_size || 0.1,
          enabled: enabled !== undefined ? enabled : true,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', orgId)
        .select()
        .single()

      console.log('✅ Update result:', { data, error })
      result = { data, error }
    } else {
      console.log('➕ Creating new branding settings for org:', orgId)
      // Create new settings
      const { data, error } = await (supabaseAdmin as any)
        .from('branding_settings')
        .insert({
          organization_id: orgId,
          logo_url,
          logo_position: logo_position || 'bottom-right',
          logo_opacity: logo_opacity || 0.7,
          logo_size: logo_size || 0.1,
          enabled: enabled !== undefined ? enabled : true
        })
        .select()
        .single()

      console.log('✅ Insert result:', { data, error })
      result = { data, error }
    }

    if (result.error) {
      console.error('❌ Error saving branding settings:', result.error)
      return NextResponse.json({ 
        error: 'Failed to save branding settings', 
        details: result.error.message 
      }, { status: 500 })
    }

    console.log('🎉 Branding settings saved successfully!')
    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Error in branding POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
