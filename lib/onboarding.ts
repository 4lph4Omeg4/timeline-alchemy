import { SupabaseClient } from '@supabase/supabase-js'
import { createStripeCustomer, getStripe } from '@/lib/stripe'

export async function setupNewUser(
    supabaseAdmin: SupabaseClient,
    userId: string,
    email: string,
    name: string,
    organizationName: string
) {
    const debugErrors: any[] = []
    const log = (msg: string, data?: any) => console.log(`[Onboarding] ${msg}`, data || '')

    log('Starting setup for user:', userId)

    // Step 1: Check/Create Admin Organization
    let adminOrgId: string | null = null

    const { data: adminOrg } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('name', 'Admin Organization')
        .single()

    if (adminOrg) {
        adminOrgId = adminOrg.id
    } else {
        // Create Admin Organization if it doesn't exist
        const { data: newAdminOrg } = await supabaseAdmin
            .from('organizations')
            .insert({
                name: 'Admin Organization',
                plan: 'transcendant'
            })
            .select()
            .single()

        if (newAdminOrg) {
            adminOrgId = newAdminOrg.id
            // Create subscription for Admin Organization
            await supabaseAdmin
                .from('subscriptions')
                .insert({
                    org_id: adminOrgId,
                    stripe_customer_id: 'admin-' + adminOrgId,
                    stripe_subscription_id: 'admin-sub-' + adminOrgId,
                    plan: 'transcendant',
                    status: 'active'
                })
        }
    }

    // Add user as CLIENT to Admin Organization
    if (adminOrgId) {
        await supabaseAdmin
            .from('org_members')
            .insert({
                org_id: adminOrgId,
                user_id: userId,
                role: 'client'
            })
    }

    // Step 2: Create user's personal organization
    const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .insert({
            name: organizationName,
            plan: 'trial'
        })
        .select()
        .single()

    if (orgError || !orgData) {
        throw new Error('Failed to create organization: ' + orgError?.message)
    }

    log('Personal organization created:', orgData.id)

    // Step 3: Add user as OWNER of their personal organization
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

    // Step 4: Create default client
    const clientName = name ? `${name}'s Client` : 'Default Client'
    await supabaseAdmin
        .from('clients')
        .insert({
            org_id: orgData.id,
            name: clientName,
            contact_info: { email: email }
        })

    // Step 5: Create Stripe customer
    if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error('STRIPE_SECRET_KEY is missing')
    }

    let stripeCustomerId: string
    try {
        const stripeCustomer = await createStripeCustomer(email, name)
        stripeCustomerId = stripeCustomer.id

        // Update organization with Stripe Customer ID
        await supabaseAdmin
            .from('organizations')
            .update({ stripe_customer_id: stripeCustomerId })
            .eq('id', orgData.id)
    } catch (stripeError: any) {
        // Rollback
        await supabaseAdmin.from('organizations').delete().eq('id', orgData.id)
        throw new Error('Failed to create Stripe customer: ' + stripeError.message)
    }

    // Step 6: Create Stripe subscription
    const stripe = getStripe()
    const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID
    let stripeSubscriptionId: string = ''

    if (basicPriceId) {
        try {
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
        } catch (error) {
            console.error('Error creating Stripe subscription:', error)
            // Don't fail the whole process if subscription fails, but log it
        }
    }

    // Step 7: Create DB subscription record
    const trialStart = new Date()
    const trialEnd = new Date(trialStart.getTime() + 14 * 24 * 60 * 60 * 1000)

    await supabaseAdmin
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

    return {
        success: true,
        orgId: orgData.id,
        stripeCustomerId
    }
}
