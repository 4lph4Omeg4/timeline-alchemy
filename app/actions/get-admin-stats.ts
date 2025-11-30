'use server'

import { supabaseAdmin } from '@/lib/supabase'

export async function getAdminStats() {
    try {
        // Fetch counts using admin client to bypass RLS
        const { count: totalOrganizations, error: orgError } = await (supabaseAdmin as any)
            .from('organizations')
            .select('*', { count: 'exact', head: true })

        const { count: activeSubscriptions, error: subError } = await (supabaseAdmin as any)
            .from('subscriptions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'active')

        const { count: totalClients, error: clientError } = await (supabaseAdmin as any)
            .from('clients')
            .select('*', { count: 'exact', head: true })

        const { count: totalPosts, error: postError } = await (supabaseAdmin as any)
            .from('blog_posts')
            .select('*', { count: 'exact', head: true })

        // Calculate posts this month
        const currentMonth = new Date().toISOString().slice(0, 7)
        const { count: postsThisMonth, error: monthlyError } = await (supabaseAdmin as any)
            .from('blog_posts')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', `${currentMonth}-01`)

        if (orgError || subError || clientError || postError || monthlyError) {
            console.error('Error fetching admin stats:', { orgError, subError, clientError, postError, monthlyError })
            throw new Error('Failed to fetch admin stats')
        }

        return {
            totalOrganizations: totalOrganizations || 0,
            activeSubscriptions: activeSubscriptions || 0,
            totalClients: totalClients || 0,
            totalPosts: totalPosts || 0,
            postsThisMonth: postsThisMonth || 0
        }
    } catch (error) {
        console.error('Server Action Error:', error)
        return {
            totalOrganizations: 0,
            activeSubscriptions: 0,
            totalClients: 0,
            totalPosts: 0,
            postsThisMonth: 0
        }
    }
}
