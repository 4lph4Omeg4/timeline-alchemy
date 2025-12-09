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

    // Step 1: Create Stripe Customer FIRST
    let stripeCustomerId: string | null = null
    if (process.env.STRIPE_SECRET_KEY) {
        try {
            log('Creating Stripe customer...')
            const stripeCustomer = await createStripeCustomer(email, name)
            stripeCustomerId = stripeCustomer.id
            log('Stripe customer created:', stripeCustomerId)
        } catch (error: any) {
            console.error('Failed to create Stripe customer:', error)
            // Proceed without Stripe
        }
    }

    // Step 2: Create Stripe subscription
    let stripeSubscriptionId: string = ''

    if (stripeCustomerId && process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID && process.env.STRIPE_SECRET_KEY) {
        try {
            const stripe = getStripe()
            const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID

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
                    user_id: userId,
                    plan: 'trial',
                },
            })
            stripeSubscriptionId = subscription.id
            log('Stripe subscription created:', stripeSubscriptionId)
        } catch (error: any) {
            console.error('Error creating Stripe subscription:', error)
        }
    } else {
        log('Skipping Stripe subscription: Missing Customer ID or Configuration')
    }

    // Step 3: Check/Create Admin Organization (Legacy/Requirement)
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
                await supabaseAdmin
                    .from('subscriptions')
                    .insert({
                        org_id: newAdminOrg.id,
                        stripe_customer_id: 'admin-' + newAdminOrg.id,
                        stripe_subscription_id: 'admin-sub-' + newAdminOrg.id,
                        plan: 'transcendant',
                        status: 'active'
                    })

                await supabaseAdmin
                    .from('org_members')
                    .insert({
                        org_id: newAdminOrg.id,
                        user_id: userId,
                        role: 'client'
                    })
            }
        } else {
            const { error: adminMemberError } = await supabaseAdmin
                .from('org_members')
                .insert({
                    org_id: adminOrg.id,
                    user_id: userId,
                    role: 'client'
                })

            if (adminMemberError) {
                // Ignore unique constraint violation
            }
        }
    } catch (e) {
        console.error('Error handling Admin Organization:', e)
    }

    // Step 4: Create or Update user's personal organization
    log('Setting up personal organization...')

    const { data: existingMembers } = await supabaseAdmin
        .from('org_members')
        .select('org_id')
        .eq('user_id', userId)
        .eq('role', 'owner')
        .maybeSingle()

    let orgId: string

    // Determine the authoritative Stripe Customer ID (or fallback)
    const finalStripeCustomerId = stripeCustomerId || `local-trial-${userId.substring(0, 8)}`
    const finalStripeSubscriptionId = stripeSubscriptionId || `local-sub-${userId.substring(0, 8)}`

    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)

    if (existingMembers) {
        log('Found existing organization (likely from trigger), updating...', existingMembers.org_id)
        orgId = existingMembers.org_id

        // Update existing organization - Force over-write of temp values
        const updateData: any = {
            // Do NOT overwrite user-defined name with default/OAuth name
            plan: 'trial',
            stripe_customer_id: finalStripeCustomerId
        }

        const { error: updateError } = await supabaseAdmin
            .from('organizations')
            .update(updateData)
            .eq('id', orgId)

        if (updateError) {
            throw new Error('Failed to update existing organization: ' + updateError.message)
        }

        // Update existing subscription (if any)
        const { data: existingSub } = await supabaseAdmin
            .from('subscriptions')
            .select('id')
            .eq('org_id', orgId)
            .maybeSingle()

        const subUpdateData: any = {
            plan: 'trial',
            status: 'trialing',
            is_trial: true,
            trial_start_date: trialStart.toISOString(),
            trial_end_date: trialEnd.toISOString(),
            stripe_customer_id: finalStripeCustomerId,
            stripe_subscription_id: finalStripeSubscriptionId
        }

        if (existingSub) {
            log('Updating existing subscription...')
            await supabaseAdmin
                .from('subscriptions')
                .update(subUpdateData)
                .eq('org_id', orgId)
        } else {
            log('Creating missing subscription for existing org...')
            await supabaseAdmin
                .from('subscriptions')
                .insert({
                    org_id: orgId,
                    ...subUpdateData
                })
        }

    } else {
        log('Creating new personal organization...')
        const { data: orgData, error: orgError } = await supabaseAdmin
            .from('organizations')
            .insert({
                name: organizationName,
                plan: 'trial',
                stripe_customer_id: finalStripeCustomerId
            })
            .select()
            .single()

        if (orgError || !orgData) {
            throw new Error('Failed to create organization: ' + orgError?.message)
        }

        orgId = orgData.id
        log('Personal organization created:', orgId)

        const { error: memberError } = await supabaseAdmin
            .from('org_members')
            .insert({
                org_id: orgId,
                user_id: userId,
                role: 'owner'
            })

        if (memberError) {
            await supabaseAdmin.from('organizations').delete().eq('id', orgId)
            throw new Error('Failed to add user to organization: ' + memberError.message)
        }

        log('Creating DB subscription record...')
        await supabaseAdmin
            .from('subscriptions')
            .insert({
                org_id: orgId,
                stripe_customer_id: finalStripeCustomerId,
                stripe_subscription_id: finalStripeSubscriptionId,
                plan: 'trial',
                status: 'trialing',
                is_trial: true,
                trial_start_date: trialStart.toISOString(),
                trial_end_date: trialEnd.toISOString()
            })
    }

    if (stripeSubscriptionId && orgId) {
        try {
            const stripe = getStripe()
            await stripe.subscriptions.update(stripeSubscriptionId, {
                metadata: {
                    org_id: orgId,
                    user_id: userId,
                    plan: 'trial'
                }
            })
        } catch (e) {
            console.error('Failed to update Stripe subscription metadata:', e)
        }
    }

    // Step 5: Create default client
    const clientName = name ? `${name}'s Client` : 'Default Client'

    const { data: existingClient } = await supabaseAdmin
        .from('clients')
        .select('id')
        .eq('org_id', orgId)
        .eq('name', clientName)
        .maybeSingle()

    if (!existingClient) {
        log('Creating default client...')
        try {
            await supabaseAdmin
                .from('clients')
                .insert({
                    org_id: orgId,
                    name: clientName,
                    contact_info: { email: email }
                })
        } catch (e) {
            console.error('Error creating default client:', e)
        }
    }

    return {
        success: true,
        orgId: orgId,
        stripeCustomerId: stripeCustomerId || undefined
    }
}
