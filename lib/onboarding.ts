import { SupabaseClient } from '@supabase/supabase-js'
import { createStripeCustomer, getStripe } from '@/lib/stripe'

export async function setupNewUser(
    supabaseAdmin: SupabaseClient,
    userId: string,
    email: string,
    name: string,
    organizationName: string
) {
    const log = (msg: string, data?: any) => console.log(`[Onboarding] ${msg}`, data ? JSON.stringify(data) : '')

    log('Starting setup for user:', userId)

    // Step 0: Validate Env
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is missing')
    }

    // Step 1: Create Stripe Customer FIRST
    let stripeCustomerId: string
    try {
        log('Creating Stripe customer...')
        const stripeCustomer = await createStripeCustomer(email, name)
        stripeCustomerId = stripeCustomer.id
        log('Stripe customer created:', stripeCustomerId)
    } catch (error: any) {
        throw new Error('Failed to create Stripe customer: ' + error.message)
    }

    // Step 2: Check/Create Admin Organization (Legacy/Requirement)
    try {
        const { data: adminOrg } = await supabaseAdmin
            .from('organizations')
            .select('id')
            .eq('name', 'Admin Organization')
            .single()

        if (!adminOrg) {
            log('Creating Admin Organization...')
            const { data: newAdminOrg } = await supabaseAdmin
                .from('organizations')
                .insert({
                    name: 'Admin Organization',
                    plan: 'transcendant'
                })
                .select()
                .single()

            if (newAdminOrg) {
                // Create subscription for Admin Organization
                await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        org_id: newAdminOrg.id,
                        stripe_customer_id: 'admin-' + newAdminOrg.id,
                        stripe_subscription_id: 'admin-sub-' + newAdminOrg.id,
                        plan: 'transcendant',
                        status: 'active'
                    })

                // Add user as CLIENT to Admin Organization
                await supabaseAdmin
                    .from('org_members')
                    .insert({
                        org_id: newAdminOrg.id,
                        user_id: userId,
                        role: 'client'
                    })
            }
        } else {
            // Add user as CLIENT to Admin Organization if they aren't already
            const { error: adminMemberError } = await supabaseAdmin
                .from('org_members')
                .insert({
                    org_id: adminOrg.id,
                    user_id: userId,
                    role: 'client'
                })

            if (adminMemberError) {
                // Ignore unique constraint violation or other errors
            }
        }
    } catch (e) {
        console.error('Error handling Admin Organization:', e)
        // Continue, as this is not critical for the user's own org
    }

    // Step 3: Create user's personal organization WITH Stripe ID
    log('Creating personal organization...')
    const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
            name: organizationName,
            plan: 'trial',
            stripe_customer_id: stripeCustomerId // Insert directly
        })
        .select()
        .single()

    if (orgError || !orgData) {
        throw new Error('Failed to create organization: ' + orgError?.message)
    }

    log('Personal organization created:', orgData.id)

    // Step 4: Add user as OWNER
    const { error: memberError } = await supabaseAdmin
        .from('org_members')
        .insert({
            org_id: orgData.id,
            user_id: userId,
            role: 'owner'
        })

    if (memberError) {
        // Rollback
        await supabaseAdmin.from('organizations').delete().eq('id', orgData.id)
        throw new Error('Failed to add user to organization: ' + memberError.message)
    }

    // Step 5: Create default client
    const clientName = name ? `${name}'s Client` : 'Default Client'
    await supabaseAdmin
        .from('clients')
        .insert({
            org_id: orgData.id,
            name: clientName,
            contact_info: { email: email }
        })

    // Step 6: Create Stripe subscription
    const stripe = getStripe()
    const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
    let stripeSubscriptionId: string = ''

    if (basicPriceId) {
        try {
            log('Creating Stripe subscription...')
            const subscription = await stripe.subscriptions.create({
                customer: stripeCustomerId,
                items: [{ price: basicPriceId }],
                trial_period_days: 14,
                payment_behavior: 'default_incomplete',
                trial_settings: {
                    end_behavior: { missing_payment_method: 'pause' },
                },
                metadata: {
                    org_id: orgData.id,
                    user_id: userId,
                    plan: 'trial',
                },
            })
            stripeSubscriptionId = subscription.id
            log('Stripe subscription created:', stripeSubscriptionId)
        } catch (error: any) {
            console.error('Error creating Stripe subscription:', error)
            // We log but don't fail, so the user can still access the app (subscription will be missing/pending)
        }
    } else {
        log('Skipping Stripe subscription: NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID not set')
    }

    // Step 7: Create DB subscription record
    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)

    log('Creating DB subscription record...', {
        org_id: orgData.id,
        stripe_customer_id: stripeCustomerId,
        stripe_subscription_id: stripeSubscriptionId || 'pending'
    })

    const { error: subError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
            org_id: orgData.id,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId || 'pending',
            plan: 'trial',
            status: 'trialing',
            is_trial: true,
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString()
        })

    if (subError) {
        console.error('Error creating DB subscription:', subError)
        // Don't throw, as the org is created and usable
    }

    return {
        success: true,
        orgId: orgData.id,
        stripeCustomerId
    }
}
