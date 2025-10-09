# Domain Configuration - Timeline Alchemy

## Configured Domains

### 1. 🎨 **Main Application Domain**
- **Domain**: `timeline-alchemy.nl`
- **Purpose**: Main application and landing page
- **Status**: ✅ Active

### 2. 🔐 **Authentication Domain** 
- **Domain**: `auth.timeline-alchemy.nl`
- **Purpose**: Supabase OAuth callback handler
- **Status**: ✅ Integrated in code
- **Callback URL**: `https://auth.timeline-alchemy.nl/callback`

### 3. 💳 **Payment Domain**
- **Domain**: `pay.timeline-alchemy.nl`
- **Purpose**: Stripe payment links and plan selection
- **Status**: ✅ Integrated in billing page
- **Usage**: View plans, upgrades, and new subscriptions

---

## Supabase Configuration Required

### Authentication Settings

Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**

#### 1. Site URL
```
https://timeline-alchemy.nl
```

#### 2. Redirect URLs (Add all of these)
```
https://timeline-alchemy.nl/auth/callback
https://auth.timeline-alchemy.nl/auth/callback
http://localhost:3000/auth/callback
```

**Note**: The app uses `window.location.origin` for redirects, so it automatically works with any domain you deploy to.

#### 3. Additional Redirect URLs
```
https://timeline-alchemy.nl/dashboard/socials
https://auth.timeline-alchemy.nl/dashboard/socials
```

### OAuth Provider Configuration

For each OAuth provider (Google, LinkedIn, Twitter, etc.), configure:

**Authorized Redirect URIs**:
```
https://timeline-alchemy.nl/auth/callback
https://auth.timeline-alchemy.nl/auth/callback
http://localhost:3000/auth/callback
```

**Important**: The app automatically redirects to `{current_domain}/auth/callback`, so as long as your domain is in this list, it will work!

---

## Stripe Configuration

### Payment Links Domain

**Stripe Dashboard** → **Settings** → **Payment Links**

1. Set custom domain: `pay.timeline-alchemy.nl`
2. Verify domain ownership
3. Enable SSL/TLS

### Billing Portal

Keep the default Stripe billing portal for managing existing subscriptions:
- **URL**: `https://billing.stripe.com/p/login/[your-portal-id]`
- **Purpose**: Manage payment methods, cancel subscriptions, download invoices

---

## Code Integration Status

### ✅ Completed Integrations

1. **Auth Domain** (Dynamic - works with any domain)
   - ✅ OAuth redirect uses `window.location.origin` in `app/auth/signin/page.tsx`
   - ✅ OAuth redirect uses `window.location.origin` in `app/auth/signup/page.tsx`
   - ✅ Callback handler ready in `app/auth/callback/page.tsx`
   - ✅ Works with: `timeline-alchemy.nl`, `auth.timeline-alchemy.nl`, or `localhost`

2. **Payment Domain** (`pay.timeline-alchemy.nl`)
   - ✅ Integrated in billing page quick access
   - ✅ Added "View Plans & Upgrade" button
   - ✅ Separated from "Manage Current Subscription" action

3. **UI Updates**
   - ✅ Dashboard header with new TA_2.jpg logo
   - ✅ Sign In page header with new logo
   - ✅ Sign In page card with new logo
   - ✅ Sign Up page header with new logo
   - ✅ Sign Up page card with new logo
   - ✅ Portfolio page header with new logo

---

## Environment Variables

### Required in Vercel

```bash
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://kjjrzhicspmbiitayrco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Auth Redirects (update if needed)
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=https://auth.timeline-alchemy.nl/callback
NEXT_PUBLIC_AUTH_CALLBACK_URL=https://auth.timeline-alchemy.nl/callback

# Stripe (already configured)
STRIPE_PUBLIC_KEY=your_key
STRIPE_SECRET_KEY=your_key
STRIPE_WEBHOOK_SECRET=your_key
```

---

## DNS Configuration

### Main Domain (`timeline-alchemy.nl`)
- **Type**: A or CNAME
- **Points to**: Vercel deployment

### Auth Subdomain (`auth.timeline-alchemy.nl`)
- **Type**: CNAME
- **Points to**: Vercel deployment
- **Purpose**: OAuth callbacks

### Payment Subdomain (`pay.timeline-alchemy.nl`)
- **Type**: CNAME  
- **Points to**: Stripe
- **Purpose**: Payment links

---

## Testing Checklist

### Authentication Flow
- [ ] Google OAuth sign in works
- [ ] Google OAuth sign up works
- [ ] Redirect to `auth.timeline-alchemy.nl/callback` succeeds
- [ ] After auth, redirect to dashboard works
- [ ] Social media OAuth connections work

### Payment Flow
- [ ] "View Plans & Upgrade" button opens `pay.timeline-alchemy.nl`
- [ ] "Manage Current Subscription" opens Stripe billing portal
- [ ] Stripe payment links work on `pay.timeline-alchemy.nl`
- [ ] Successful payment redirects work

### UI Consistency
- [ ] Logo appears on all pages (homepage, dashboard, auth pages, portfolio)
- [ ] Header is consistent across application
- [ ] Navigation works from all pages

---

## Troubleshooting

### OAuth Redirect Issues

**Problem**: "Invalid redirect URL" error

**Solution**:
1. Check Supabase redirect URLs include `auth.timeline-alchemy.nl`
2. Verify DNS for `auth.timeline-alchemy.nl` points to Vercel
3. Check OAuth provider settings include the new domain

### Payment Link Issues

**Problem**: Payment page doesn't load

**Solution**:
1. Verify `pay.timeline-alchemy.nl` is configured in Stripe
2. Check DNS propagation
3. Verify SSL certificate is active

---

## Deployment Notes

### After Deployment

1. **Test OAuth Flow**
   ```
   1. Go to sign in page
   2. Click "Sign in with Google"
   3. Verify redirect to auth.timeline-alchemy.nl
   4. Verify redirect back to dashboard
   ```

2. **Test Payment Links**
   ```
   1. Go to billing page
   2. Click "View Plans & Upgrade"
   3. Verify opens pay.timeline-alchemy.nl
   4. Test a payment flow
   ```

3. **Verify All Headers**
   ```
   1. Check homepage header
   2. Check dashboard header
   3. Check auth pages headers
   4. Check portfolio page header
   ```

---

## Support Resources

- **Supabase Docs**: https://supabase.com/docs/guides/auth
- **Stripe Docs**: https://stripe.com/docs/payments/payment-links
- **Vercel Domains**: https://vercel.com/docs/concepts/projects/domains

---

**Last Updated**: October 9, 2025  
**Status**: ✅ Ready for deployment

