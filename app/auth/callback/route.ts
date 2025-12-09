import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { setupNewUser } from '@/lib/onboarding'

export const dynamic = 'force-dynamic'


export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')

    // Debug logging
    const cookieStore = cookies()
    console.log('Callback Cookies:', cookieStore.getAll().map(c => c.name))

    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard'

    // Handle social media success params (legacy/custom flow support)
    const linkedinSuccess = searchParams.get('linkedin_success')
    const twitterSuccess = searchParams.get('twitter_success')
    const username = searchParams.get('username')

    if (linkedinSuccess) {
        return NextResponse.redirect(`${origin}/dashboard/socials?success=linkedin_connected`)
    }

    if (twitterSuccess) {
        return NextResponse.redirect(`${origin}/dashboard/socials?success=twitter_connected&username=${username}`)
    }

    let authError = null

    if (code) {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll()
                    },
                    setAll(cookiesToSet) {
                        try {
                            cookiesToSet.forEach(({ name, value, options }) =>
                                cookieStore.set(name, value, options)
                            )
                        } catch {
                            // The `setAll` method was called from a Server Component.
                            // This can be ignored if you have middleware refreshing
                            // user sessions.
                        }
                    },
                },
            }
        )

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
            authError = error
        }

        if (!error && session?.user) {
            // Check if user is new (has no organization)
            // We need supabaseAdmin for this to ensure we can read/write everything
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.SUPABASE_SERVICE_ROLE_KEY!,
                {
                    auth: {
                        autoRefreshToken: false,
                        persistSession: false
                    }
                }
            )

            try {
                // Always run setupNewUser to ensure any trigger-created artifacts are upgraded
                // (e.g. converting 'temp-sub' to real Stripe trial or fallback)
                console.log('Running user setup/check in OAuth callback...')
                const name = session.user.user_metadata.name || session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User'
                const email = session.user.email!
                const orgName = `${name}'s Organization`

                // We pass the generated orgName, but setupNewUser is now smart enough to NOT overwrite
                // an existing organization's name if the user has renamed it.
                await setupNewUser(supabaseAdmin, session.user.id, email, name, orgName)
                console.log('Setup completed/verified for user:', session.user.id)
            } catch (setupError) {
                console.error('Error setting up new user in callback:', setupError)
                // We don't block the login, but the user might have a broken state
            }

            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error('Auth code exchange error:', error)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_failed&details=${encodeURIComponent(authError?.message || 'Unknown error')}`)
}
