import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { setupNewUser } from '@/lib/onboarding'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
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

    if (code) {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                    set(name: string, value: string, options: CookieOptions) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name: string, options: CookieOptions) {
                        cookieStore.delete({ name, ...options })
                    },
                },
            }
        )

        const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

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
                const { data: orgMembers } = await supabaseAdmin
                    .from('org_members')
                    .select('id')
                    .eq('user_id', session.user.id)
                    .maybeSingle()

                if (!orgMembers) {
                    console.log('New user detected in OAuth callback, running setup...')
                    const name = session.user.user_metadata.name || session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User'
                    const email = session.user.email!
                    const orgName = `${name}'s Organization`

                    await setupNewUser(supabaseAdmin, session.user.id, email, name, orgName)
                    console.log('Setup completed for user:', session.user.id)
                }
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
    return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_failed`)
}

