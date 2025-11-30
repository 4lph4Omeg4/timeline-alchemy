
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

async function diagnoseUserState(emailOrId: string) {
    console.log(`\n🔍 DIAGNOSING USER STATE FOR: ${emailOrId}\n`)

    // 1. Find the User
    let userId = emailOrId
    if (emailOrId.includes('@')) {
        const { data: { users }, error } = await supabase.auth.admin.listUsers()
        const user = users?.find(u => u.email === emailOrId)
        if (!user) {
            console.error('❌ User not found!')
            return
        }
        userId = user.id
        console.log(`✅ Found User: ${user.email} (ID: ${userId})`)
    } else {
        console.log(`ℹ️ Using provided User ID: ${userId}`)
    }

    // 2. Check Organization Memberships
    console.log('\n--- 🏢 ORGANIZATION MEMBERSHIPS ---')
    const { data: memberships, error: memberError } = await supabase
        .from('org_members')
        .select('*')
        .eq('user_id', userId)

    if (memberError) {
        console.error('❌ Error fetching memberships:', memberError)
    } else if (memberships.length === 0) {
        console.log('⚠️ User has NO organization memberships.')
    } else {
        for (const member of memberships) {
            console.log(`\n• Member in Org ID: ${member.org_id}`)
            console.log(`  - Role: ${member.role}`)
            console.log(`  - Created At: ${member.created_at}`)

            // 3. Get Organization Details
            const { data: org, error: orgError } = await supabase
                .from('organizations')
                .select('*')
                .eq('id', member.org_id)
                .single()

            if (orgError) {
                console.error(`  ❌ Error fetching org details: ${orgError.message}`)
            } else {
                console.log(`  - Org Name: "${org.name}"`)
                console.log(`  - Plan: ${org.plan}`)
                console.log(`  - Stripe Customer ID: ${org.stripe_customer_id || 'N/A'}`)
            }

            // 4. Check Clients in this Org
            const { data: clients, error: clientError } = await supabase
                .from('clients')
                .select('*')
                .eq('org_id', member.org_id)

            if (clientError) {
                console.error(`  ❌ Error fetching clients: ${clientError.message}`)
            } else {
                console.log(`  - Clients (${clients.length}):`)
                clients.forEach(c => console.log(`    • "${c.name}" (ID: ${c.id})`))
            }

            // 5. Check Subscriptions for this Org
            const { data: subs, error: subError } = await supabase
                .from('subscriptions')
                .select('*')
                .eq('org_id', member.org_id)

            if (subError) {
                console.error(`  ❌ Error fetching subscriptions: ${subError.message}`)
            } else {
                console.log(`  - Subscriptions (${subs.length}):`)
                subs.forEach(s => {
                    console.log(`    • Status: ${s.status}, Plan: ${s.plan}`)
                    console.log(`      Stripe Sub ID: ${s.stripe_subscription_id}`)
                })
            }
        }
    }

    console.log('\n-----------------------------------')
    console.log('Diagnosis Complete.')
}

// Get email from command line arg
const targetEmail = process.argv[2]
if (!targetEmail) {
    console.log('Please provide an email address as an argument.')
    console.log('Usage: npx tsx scripts/diagnose-user-state.ts user@example.com')
} else {
    diagnoseUserState(targetEmail)
}
