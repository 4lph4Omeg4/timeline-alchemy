
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

async function repairOrgClient(orgId: string) {
    console.log(`\n🔧 REPAIRING ORGANIZATION: ${orgId}\n`)

    // 1. Get Org Details
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single()

    if (orgError || !org) {
        console.error('❌ Organization not found!')
        return
    }

    console.log(`✅ Found Org: "${org.name}"`)

    // 2. Check for existing clients
    const { data: clients } = await supabase
        .from('clients')
        .select('*')
        .eq('org_id', orgId)

    if (clients && clients.length > 0) {
        console.log(`⚠️ Organization already has ${clients.length} clients. No repair needed.`)
        return
    }

    // 3. Create Default Client
    console.log('🛠️ Creating default client...')
    const clientName = `${org.name}'s Client`

    const { data: newClient, error: createError } = await supabase
        .from('clients')
        .insert({
            org_id: orgId,
            name: clientName
        })
        .select()
        .single()

    if (createError) {
        console.error('❌ Failed to create client:', createError)
    } else {
        console.log(`✅ Success! Created client: "${newClient.name}" (ID: ${newClient.id})`)
    }
}

// Get Org ID from command line
const targetOrgId = process.argv[2]
if (!targetOrgId) {
    console.log('Please provide the Organization ID as an argument.')
    console.log('Usage: npx tsx scripts/repair-org-client.ts <ORG_ID>')
} else {
    repairOrgClient(targetOrgId)
}
