
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import { createClient } from '@supabase/supabase-js'
import fetch from 'node-fetch'

// Force node-fetch for Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        fetch: fetch as any
    }
})

async function deleteOrganization(orgId: string) {
    console.log(`\n🗑️ DELETING ORGANIZATION: ${orgId}\n`)

    // 1. Delete Subscriptions
    const { error: subError } = await supabase
        .from('subscriptions')
        .delete()
        .eq('org_id', orgId)

    if (subError) console.error('Error deleting subscriptions:', subError)
    else console.log('✅ Deleted subscriptions')

    // 2. Delete Clients
    const { error: clientError } = await supabase
        .from('clients')
        .delete()
        .eq('org_id', orgId)

    if (clientError) console.error('Error deleting clients:', clientError)
    else console.log('✅ Deleted clients')

    // 3. Delete Memberships
    const { error: memberError } = await supabase
        .from('org_members')
        .delete()
        .eq('org_id', orgId)

    if (memberError) console.error('Error deleting memberships:', memberError)
    else console.log('✅ Deleted memberships')

    // 4. Delete Organization
    const { error: orgError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgId)

    if (orgError) console.error('Error deleting organization:', orgError)
    else console.log('✅ Deleted organization')

    console.log('\n-----------------------------------')
    console.log('Cleanup Complete. You can now try creating the organization again.')
}

// Get Org ID from command line
const targetOrgId = process.argv[2]
if (!targetOrgId) {
    console.log('Please provide the Organization ID as an argument.')
    console.log('Usage: npx tsx scripts/delete-org.ts <ORG_ID>')
} else {
    deleteOrganization(targetOrgId)
}
