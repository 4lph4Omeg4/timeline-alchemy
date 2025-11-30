import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import fetch from 'node-fetch'
import { createClient } from '@supabase/supabase-js'
import { getStripe } from '../lib/stripe'

const supabaseUrl = 'https://kjjrzhicspmbiitayrco.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    },
    global: {
        fetch: fetch as any
    }
})

async function main() {
    console.log('Checking env vars...')
    console.log('SUPABASE_URL:', !!process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('SUPABASE_SERVICE_ROLE_KEY:', !!process.env.SUPABASE_SERVICE_ROLE_KEY)
    console.log('STRIPE_SECRET_KEY:', !!process.env.STRIPE_SECRET_KEY)

    // 1. Find the organization "The Light"
    console.log('\nFinding organization "The Light"...')
    const { data: orgs, error: orgError } = await (supabaseAdmin as any)
        .from('organizations')
        .select('*')
        .eq('name', 'The Light')
        .order('created_at', { ascending: false })
        .limit(1)

    if (orgError) {
        console.error('Error finding org:', orgError)
        return
    }

    if (!orgs || orgs.length === 0) {
        console.error('Organization "The Light" not found.')
        // Try listing any org to verify connection
        const { data: anyOrgs } = await (supabaseAdmin as any).from('organizations').select('id, name').limit(3)
        console.log('Available orgs:', anyOrgs)
        return
    }

    const org = orgs[0]
    console.log('Found org:', org.id, org.name)

    // 2. Try to insert a client
    console.log('\nAttempting to insert client...')
    const clientName = 'Debug Client'
    const email = 'debug@example.com'

    const { data: client, error: clientError } = await (supabaseAdmin as any)
        .from('clients')
        .insert({
            org_id: org.id,
            name: clientName,
            contact_info: { email }
        })
        .select()

    if (clientError) {
        console.error('Error inserting client:', clientError)
        console.error('Details:', JSON.stringify(clientError, null, 2))

        // Retry without contact info
        console.log('Retrying without contact info...')
        const { data: clientRetry, error: retryRetry } = await (supabaseAdmin as any)
            .from('clients')
            .insert({
                org_id: org.id,
                name: clientName
            })
            .select()

        if (retryRetry) {
            console.error('Retry error:', retryRetry)
        } else {
            console.log('Retry success:', clientRetry)
            await (supabaseAdmin as any).from('clients').delete().eq('id', clientRetry[0].id)
        }

    } else {
        console.log('Client inserted successfully:', client)
        // Cleanup
        await (supabaseAdmin as any).from('clients').delete().eq('id', client[0].id)
    }

    // 3. Test Stripe
    console.log('\nTesting Stripe...')
    try {
        const stripe = getStripe()
        const customer = await stripe.customers.create({
            email: 'debug-stripe@example.com',
            name: 'Debug Stripe'
        })
        console.log('Stripe customer created:', customer.id)
        await stripe.customers.del(customer.id)
        console.log('Stripe customer deleted.')
    } catch (err) {
        console.error('Stripe error:', err)
    }
}

main()
