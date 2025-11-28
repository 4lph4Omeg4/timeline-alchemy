import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

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
        const supabase = createClient(cookieStore)

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            return NextResponse.redirect(`${origin}${next}`)
        } else {
            console.error('Auth code exchange error:', error)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/signin?error=auth_callback_failed`)
}
