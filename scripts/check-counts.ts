import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCounts() {
    console.log('Checking database counts...')

    const { count: orgCount } = await supabase.from('organizations').select('*', { count: 'exact', head: true })
    const { count: subCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true })
    const { count: activeSubCount } = await supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active')
    const { count: clientCount } = await supabase.from('clients').select('*', { count: 'exact', head: true })

    console.log('Organizations:', orgCount)
    console.log('Total Subscriptions:', subCount)
    console.log('Active Subscriptions:', activeSubCount)
    console.log('Clients:', clientCount)

    // List organizations to see if there's a "system" one
    const { data: orgs } = await supabase.from('organizations').select('id, name, plan')
    console.log('Organizations List:', orgs)
}

checkCounts()
