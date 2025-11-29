import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabaseUser = createClient(cookieStore)

        // 1. Fetch Organizations
        const { data: userOrgs, error: userOrgsError } = await supabaseUser
            .from('organizations')
            .select('id, name')

        const { data: adminOrgs, error: adminOrgsError } = await (supabaseAdmin as any)
            .from('organizations')
            .select('id, name')

        // 2. Fetch Clients
        const { data: userClients, error: userClientsError } = await supabaseUser
            .from('clients')
            .select('id, name, org_id')

        const { data: adminClients, error: adminClientsError } = await (supabaseAdmin as any)
            .from('clients')
            .select('id, name, org_id')

        // 3. Fetch Subscriptions
        const { data: userSubs, error: userSubsError } = await supabaseUser
            .from('subscriptions')
            .select('id, plan, status, org_id')

        const { data: adminSubs, error: adminSubsError } = await (supabaseAdmin as any)
            .from('subscriptions')
            .select('id, plan, status, org_id')

        // Calculate Differences
        const missingOrgs = adminOrgs?.filter((a: any) => !userOrgs?.some((u: any) => u.id === a.id)) || []
        const missingClients = adminClients?.filter((a: any) => !userClients?.some((u: any) => u.id === a.id)) || []
        const missingSubs = adminSubs?.filter((a: any) => !userSubs?.some((u: any) => u.id === a.id)) || []

        return NextResponse.json({
            userView: {
                orgsCount: userOrgs?.length,
                clientsCount: userClients?.length,
                subsCount: userSubs?.length,
                errors: { userOrgsError, userClientsError, userSubsError }
            },
            adminView: {
                orgsCount: adminOrgs?.length,
                clientsCount: adminClients?.length,
                subsCount: adminSubs?.length,
                errors: { adminOrgsError, adminClientsError, adminSubsError }
            },
            missing: {
                organizations: missingOrgs,
                clients: missingClients,
                subscriptions: missingSubs
            }
        })

    } catch (error) {
        return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
    }
}
