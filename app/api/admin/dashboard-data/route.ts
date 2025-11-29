import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createClient(cookieStore)

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch all data using admin client to bypass RLS
        const [
            { data: clients, error: clientsError },
            { data: organizations, error: orgsError },
            { data: subscriptions, error: subsError }
        ] = await Promise.all([
            (supabaseAdmin as any).from('clients').select('*, organizations(name)').order('name'),
            (supabaseAdmin as any).from('organizations').select('*, subscriptions(*), clients(*)').order('created_at', { ascending: false }),
            (supabaseAdmin as any).from('subscriptions').select('*, organizations(name)').order('created_at', { ascending: false })
        ])

        if (clientsError || orgsError || subsError) {
            console.error('Error fetching admin data:', { clientsError, orgsError, subsError })
            return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
        }

        return NextResponse.json({
            clients: clients || [],
            organizations: organizations || [],
            subscriptions: subscriptions || []
        })

    } catch (error) {
        console.error('Admin dashboard API error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
