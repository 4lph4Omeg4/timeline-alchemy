import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { logo_url, logo_position = 'bottom-right', logo_opacity = 0.7, logo_size = 0.1 } = await request.json()

    if (!logo_url) {
      return NextResponse.json({ error: 'Logo URL is required' }, { status: 400 })
    }

    console.log('🔄 Updating Admin Organization branding settings...')
    console.log('🔄 Logo URL:', logo_url)

    // First, get the Admin Organization ID
    const { data: adminOrg, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id')
      .eq('name', 'Admin Organization')
      .single()

    if (orgError || !adminOrg) {
      console.error('❌ Admin Organization not found:', orgError)
      return NextResponse.json({ error: 'Admin Organization not found' }, { status: 404 })
    }

    const adminOrgId = (adminOrg as { id: string }).id
    console.log('🏢 Admin Organization ID:', adminOrgId)

    // Update or insert branding settings for Admin Organization
    const { data: brandingData, error: brandingError } = await supabaseAdmin
      .from('branding_settings')
      .upsert({
        organization_id: adminOrgId,
        logo_url,
        logo_position,
        logo_opacity,
        logo_size,
        enabled: true
      }, {
        onConflict: 'organization_id'
      })
      .select()
      .single()

    if (brandingError) {
      console.error('❌ Error updating branding settings:', brandingError)
      return NextResponse.json({ error: 'Failed to update branding settings' }, { status: 500 })
    }

    console.log('✅ Admin Organization branding updated successfully:', brandingData)

    return NextResponse.json({ 
      success: true, 
      branding: brandingData,
      message: 'Admin Organization branding updated successfully'
    })

  } catch (error) {
    console.error('❌ Error updating Admin Organization branding:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
