import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData()
        const signedRequest = formData.get('signed_request') as string

        if (!signedRequest) {
            return NextResponse.json({ error: 'Missing signed_request' }, { status: 400 })
        }

        const [encodedSig, payload] = signedRequest.split('.')
        const appSecret = process.env.FACEBOOK_APP_SECRET || process.env.INSTAGRAM_CLIENT_SECRET

        if (!appSecret) {
            console.error('Missing FACEBOOK_APP_SECRET')
            return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
        }

        // Verify signature
        const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('hex')
        const expectedSig = crypto
            .createHmac('sha256', appSecret)
            .update(payload)
            .digest('hex')

        if (sig !== expectedSig) {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
        }

        // Decode payload
        const data = JSON.parse(Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8'))
        const userId = data.user_id

        // Remove user data
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

        // Delete social connection for this Facebook user
        const { error } = await supabaseAdmin
            .from('social_connections')
            .delete()
            .filter('account_id', 'eq', `facebook_${userId}`)

        if (error) {
            console.error('Failed to delete user social connection:', error)
        }

        // Return the URL where the user can check the status of their deletion request
        // According to FB docs, this should return a JSON with "url" and "confirmation_code"
        return NextResponse.json({
            url: `${process.env.NEXT_PUBLIC_APP_URL}/privacy/deletion-status?id=${userId}`,
            confirmation_code: userId // In a real app, generate a unique tracking ID
        })
    } catch (error) {
        console.error('Data deletion request error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
