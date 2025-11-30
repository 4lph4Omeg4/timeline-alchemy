import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getStripe } from '@/lib/stripe'

export async function GET(request: NextRequest) {
    const results: any = {
        env: {
            STRIPE_SECRET_KEY_SET: !!process.env.STRIPE_SECRET_KEY,
            NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID_SET: !!process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
            NEXT_PUBLIC_SUPABASE_URL_SET: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
            SUPABASE_SERVICE_ROLE_KEY_SET: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        },
        stripe: {
            status: 'pending',
            error: null
        },
        supabase: {
            status: 'pending',
            error: null
        }
    }

    // Test Stripe
    try {
        if (process.env.STRIPE_SECRET_KEY) {
            const stripe = getStripe()
            const customer = await stripe.customers.create({
                email: 'test-config@example.com',
                name: 'Test Config',
                metadata: { test: 'true' }
            })
            results.stripe.status = 'success'
            results.stripe.customerId = customer.id

            // Clean up
            await stripe.customers.del(customer.id)
        } else {
            results.stripe.status = 'skipped'
            results.stripe.error = 'Missing STRIPE_SECRET_KEY'
        }
    } catch (error: any) {
        results.stripe.status = 'failed'
        results.stripe.error = error.message
    }

    // Test Supabase Admin
    try {
        const { data, error } = await supabaseAdmin.from('organizations').select('count').limit(1).single()
        if (error) {
            results.supabase.status = 'failed'
            results.supabase.error = error.message
        } else {
            results.supabase.status = 'success'
            results.supabase.data = data
        }
    } catch (error: any) {
        results.supabase.status = 'failed'
        results.supabase.error = error.message
    }

    return NextResponse.json(results)
}
