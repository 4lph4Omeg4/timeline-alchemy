import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import fetch from 'node-fetch'
import { getStripe } from '../lib/stripe'

// Force node-fetch for global environment if needed (though getStripe uses stripe-node which uses its own http client, usually standard node https)
// But just in case any other deps need it
if (!global.fetch) {
    (global as any).fetch = fetch
}

async function main() {
    console.log('Checking env vars...')
    console.log('STRIPE_SECRET_KEY:', !!process.env.STRIPE_SECRET_KEY)
    const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
    console.log('NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID:', basicPriceId)

    if (!process.env.STRIPE_SECRET_KEY || !basicPriceId) {
        console.error('Missing env vars')
        return
    }

    const stripe = getStripe()

    // 1. Create a test customer
    console.log('\nCreating test customer...')
    let customerId = ''
    try {
        const customer = await stripe.customers.create({
            email: 'debug-sub-test@example.com',
            name: 'Debug Sub Test'
        })
        customerId = customer.id
        console.log('Customer created:', customerId)
    } catch (err) {
        console.error('Error creating customer:', err)
        return
    }

    // 2. Try to create subscription with advanced trial settings
    console.log('\nAttempting to create subscription with advanced trial settings...')
    try {
        const subscription = await stripe.subscriptions.create({
            customer: customerId,
            items: [
                {
                    price: basicPriceId,
                },
            ],
            trial_period_days: 14,
            payment_behavior: 'default_incomplete',
            trial_settings: {
                end_behavior: {
                    missing_payment_method: 'pause',
                },
            },
            metadata: {
                plan: 'trial',
                debug: 'true'
            },
        })
        console.log('Success! Subscription created:', subscription.id)
        console.log('Status:', subscription.status)
        console.log('Trial end:', subscription.trial_end)

        // Cleanup
        await stripe.subscriptions.cancel(subscription.id)
        console.log('Subscription canceled.')

    } catch (err: any) {
        console.error('FAILED to create advanced subscription.')
        console.error('Error type:', err.type)
        console.error('Error code:', err.code)
        console.error('Error message:', err.message)
        console.error('Full error:', JSON.stringify(err, null, 2))

        // 3. Retry without advanced settings
        console.log('\nRetrying without advanced trial settings...')
        try {
            const retrySubscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [
                    {
                        price: basicPriceId,
                    },
                ],
                trial_period_days: 14,
                metadata: {
                    plan: 'trial',
                    debug: 'retry'
                },
            })
            console.log('Retry Success! Subscription created:', retrySubscription.id)

            // Cleanup
            await stripe.subscriptions.cancel(retrySubscription.id)
            console.log('Retry Subscription canceled.')

        } catch (retryErr: any) {
            console.error('Retry FAILED as well.')
            console.error('Error message:', retryErr.message)
        }
    }

    // Cleanup customer
    if (customerId) {
        await stripe.customers.del(customerId)
        console.log('Customer deleted.')
    }
}

main()
