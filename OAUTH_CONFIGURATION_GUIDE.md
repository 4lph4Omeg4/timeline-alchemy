# OAuth Configuration Complete Guide

Dit document legt uit hoe de twee OAuth systemen in Timeline Alchemy werken en hoe ze correct te configureren.

## 🎯 Twee Onafhankelijke OAuth Flows


### 2️⃣ Supabase Auth (User Login)
**Purpose**: Gebruikers inloggen in de Timeline Alchemy app

**Flow**:
```
User klikt "Sign in with Google"
  ↓
Supabase OAuth (via auth.timeline-alchemy.nl)
  ↓
Supabase callback: https://auth.timeline-alchemy.nl/auth/v1/callback
  ↓
App callback: https://www.timeline-alchemy.nl/auth/callback
  ↓
Redirect naar: /dashboard
```

**Environment Variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://kjjrzhicspmbiitayrco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Supabase Dashboard Configuration**:
1. Ga naar https://app.supabase.com/project/kjjrzhicspmbiitayrco/auth/url-configuration
2. **Site URL**: `https://www.timeline-alchemy.nl`
3. **Redirect URLs**:
   - `https://www.timeline-alchemy.nl/auth/callback`
   - `https://auth.timeline-alchemy.nl/auth/callback`
   - `http://localhost:3000/auth/callback` (voor development)

### 3️⃣ Supabase OAuth Server (Identity Provider)
**Purpose**: Timeline Alchemy gebruiken als login provider voor *andere* apps (Timeline Alchemy is de provider)

**Configuration**:
1. Ga naar Supabase Dashboard → Authentication → OAuth Server
2. **Enable Supabase OAuth Server**: ON
3. **Site URL**: `https://www.timeline-alchemy.nl`
4. **Authorization Path**: `/oauth/consent` (⚠️ NIET de bestandsnaam `page.tsx`, alleen het pad)
   - Preview URL moet zijn: `https://timeline-alchemy.nl/oauth/consent`


---

### 2️⃣ Social Media OAuth (Platform Connections)
**Purpose**: Social media accounts verbinden om namens gebruiker te posten

**Flow**:
```
User klikt "Connect Twitter" in /dashboard/socials
  ↓
App redirect: https://www.timeline-alchemy.nl/api/auth/twitter
  ↓
Twitter OAuth: https://twitter.com/i/oauth2/authorize
  ↓
Twitter callback: https://www.timeline-alchemy.nl/api/auth/twitter/callback
  ↓
Token opslaan in database (social_connections table)
  ↓
Redirect naar: /dashboard/socials?success=twitter_connected
```

## 🔧 Platform-Specific Configuratie

### Twitter (X) OAuth 2.0

**Developer Portal**: https://developer.twitter.com/en/portal/dashboard

**App Type**: Web App, Automated App or Bot

**OAuth 2.0 Settings**:
- **App permissions**: Read and Write
- **Type of App**: Web App, Automated App or Bot
- **Callback URI / Redirect URL**:
  ```
  https://www.timeline-alchemy.nl/api/auth/twitter/callback
  http://localhost:3000/api/auth/twitter/callback
  ```
- **Website URL**: `https://www.timeline-alchemy.nl`

**Environment Variables**:
```bash
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_client_id
TWITTER_CLIENT_SECRET=your_client_secret
```

**Important**: 
- Twitter requires OAuth 2.0 with PKCE (Proof Key for Code Exchange)
- ✅ Already implemented in the new routes
- Scopes: `tweet.read tweet.write users.read offline.access`

---

### LinkedIn OAuth 2.0

**Developer Portal**: https://www.linkedin.com/developers/apps

**OAuth 2.0 Settings**:
- **Authorized redirect URLs**:
  ```
  https://www.timeline-alchemy.nl/api/auth/linkedin/callback
  http://localhost:3000/api/auth/linkedin/callback
  ```

**Environment Variables**:
```bash
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
```

**Products to Enable**:
- Sign In with LinkedIn using OpenID Connect
- Share on LinkedIn
- Advertising API (if needed)

**OAuth Scopes**: `openid profile w_member_social`

---

### Facebook/Instagram OAuth

**Developer Portal**: https://developers.facebook.com/apps

**OAuth Settings**:
- **Valid OAuth Redirect URIs**:
  ```
  https://www.timeline-alchemy.nl/api/auth/facebook/callback
  https://www.timeline-alchemy.nl/api/auth/instagram/callback
  http://localhost:3000/api/auth/facebook/callback
  http://localhost:3000/api/auth/instagram/callback
  ```

**Environment Variables**:
```bash
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret
```

**Permissions to Request**:
- `public_profile`
- `pages_show_list`
- `pages_read_engagement`
- `pages_manage_posts`
- `instagram_basic`
- `instagram_content_publish`

**Important**:
- Instagram posting works via Facebook Pages API
- User needs a Facebook Page with connected Instagram Business Account
- Personal Instagram accounts won't work - must be Business/Creator account

---

### YouTube OAuth 2.0 (Google Cloud)

**Developer Console**: https://console.cloud.google.com/apis/credentials

**OAuth 2.0 Client Setup**:
- **Application type**: Web application
- **Authorized redirect URIs**:
  ```
  https://www.timeline-alchemy.nl/api/auth/youtube/callback
  http://localhost:3000/api/auth/youtube/callback
  ```

**Environment Variables**:
```bash
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
```

**APIs to Enable**:
- YouTube Data API v3

**OAuth Scopes**:
- `https://www.googleapis.com/auth/youtube.upload`
- `https://www.googleapis.com/auth/youtube.readonly`

---

### Discord OAuth 2.0

**Developer Portal**: https://discord.com/developers/applications

**OAuth2 Settings**:
- **Redirects**:
  ```
  https://www.timeline-alchemy.nl/api/auth/discord/callback
  http://localhost:3000/api/auth/discord/callback
  ```

**Environment Variables**:
```bash
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_client_id
DISCORD_CLIENT_SECRET=your_client_secret
```

**OAuth Scopes**: `identify guilds`

**Important**:
- Posting requires a Discord Bot
- OAuth only gets user info and guild list
- Separate bot token needed for actual posting

---

### Reddit OAuth 2.0

**Developer Portal**: https://www.reddit.com/prefs/apps

**App Type**: Web app

**OAuth Settings**:
- **redirect uri**:
  ```
  https://www.timeline-alchemy.nl/api/auth/reddit/callback
  http://localhost:3000/api/auth/reddit/callback
  ```

**Environment Variables**:
```bash
NEXT_PUBLIC_REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
```

**OAuth Scopes**: `identity submit`

**Important**:
- Reddit requires Basic Auth with client credentials
- User-Agent header is mandatory: `TimelineAlchemy/1.0 by sh4m4ni4k`

---

## 🌐 DNS Configuration

### Current Setup

```
timeline-alchemy.nl           → Vercel (Main app)
www.timeline-alchemy.nl       → Vercel (Main app)
auth.timeline-alchemy.nl      → Vercel (Auth subdomain for Supabase callbacks)
pay.timeline-alchemy.nl       → Stripe (Payment links)
```

### Vercel Domain Settings

1. Go to: https://vercel.com/your-team/timeline-alchemy/settings/domains
2. Add these domains:
   - `timeline-alchemy.nl` (Production)
   - `www.timeline-alchemy.nl` (Production)
   - `auth.timeline-alchemy.nl` (Production)

### Environment Variables in Vercel

```bash
# App URLs
NEXT_PUBLIC_APP_URL=https://www.timeline-alchemy.nl
NEXT_PUBLIC_SITE_URL=https://www.timeline-alchemy.nl

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://kjjrzhicspmbiitayrco.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key

# Social Media APIs
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_key
TWITTER_CLIENT_SECRET=your_key
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_key
LINKEDIN_CLIENT_SECRET=your_key
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_key
INSTAGRAM_CLIENT_SECRET=your_key
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_key
YOUTUBE_CLIENT_SECRET=your_key
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_key
DISCORD_CLIENT_SECRET=your_key
NEXT_PUBLIC_REDDIT_CLIENT_ID=your_key
REDDIT_CLIENT_SECRET=your_key
TELEGRAM_BOT_TOKEN=your_key
```

---

## 🧪 Testing Guide

### 1. Test Supabase Auth (User Login)

```bash
# Local
1. Go to http://localhost:3000/auth/signin
2. Click "Sign in with Google"
3. Should redirect to Supabase OAuth
4. Should redirect back to http://localhost:3000/auth/callback
5. Should redirect to http://localhost:3000/dashboard

# Production
1. Go to https://www.timeline-alchemy.nl/auth/signin
2. Click "Sign in with Google"
3. Should redirect to Supabase OAuth (auth.timeline-alchemy.nl)
4. Should redirect back to https://www.timeline-alchemy.nl/auth/callback
5. Should redirect to https://www.timeline-alchemy.nl/dashboard
```

### 2. Test Social Media OAuth (Platform Connections)

```bash
# Local
1. Sign in to http://localhost:3000
2. Go to http://localhost:3000/dashboard/socials
3. Click "Connect Account" for any platform
4. Should redirect to http://localhost:3000/api/auth/{platform}
5. Should redirect to platform's OAuth page
6. After authorization, should redirect to http://localhost:3000/api/auth/{platform}/callback
7. Should save tokens and redirect to http://localhost:3000/dashboard/socials?success={platform}_connected

# Production
1. Sign in to https://www.timeline-alchemy.nl
2. Go to https://www.timeline-alchemy.nl/dashboard/socials
3. Click "Connect Account" for any platform
4. Should redirect to https://www.timeline-alchemy.nl/api/auth/{platform}
5. Should redirect to platform's OAuth page
6. After authorization, should redirect to https://www.timeline-alchemy.nl/api/auth/{platform}/callback
7. Should save tokens and redirect to https://www.timeline-alchemy.nl/dashboard/socials?success={platform}_connected
```

---

## 🐛 Common Issues & Solutions

### Issue: "redirect_uri_mismatch"
**Solution**: 
- Check that callback URLs in platform developer console EXACTLY match your app URLs
- No trailing slashes
- HTTPS in production, HTTP in local dev

### Issue: "missing_credentials" error
**Solution**:
- Verify environment variables are set correctly in Vercel
- Check that CLIENT_ID is public (`NEXT_PUBLIC_*`) but SECRET is private
- Redeploy after changing environment variables

### Issue: Twitter "invalid_request" or PKCE errors
**Solution**:
- Twitter OAuth 2.0 requires PKCE
- ✅ Already implemented in `/api/auth/twitter/route.ts`
- Make sure you're using OAuth 2.0, not OAuth 1.0a

### Issue: Instagram connection fails
**Solution**:
- Instagram requires Facebook Business Manager setup
- User needs Facebook Page connected to Instagram Business Account
- Personal Instagram won't work
- Request `instagram_content_publish` permission in Facebook App Review

### Issue: Supabase callbacks not working
**Solution**:
1. Check Supabase Dashboard → Authentication → URL Configuration
2. Make sure redirect URLs include:
   - `https://www.timeline-alchemy.nl/auth/callback`
   - `http://localhost:3000/auth/callback`
3. Site URL should be: `https://www.timeline-alchemy.nl`

### Issue: "auth_required" in social media callback
**Solution**:
- This happens when user session expires during OAuth
- User should sign in first, then connect social media
- Added automatic redirect to signin in callback handlers

---

## 📊 Monitoring

### Check OAuth Flow Success

1. **Supabase Auth**:
   - Check Supabase Dashboard → Authentication → Logs
   - Look for successful sign-ins

2. **Social Media OAuth**:
   - Check Vercel logs for `/api/auth/{platform}` and `/api/auth/{platform}/callback`
   - Check database: `social_connections` table should have new rows
   - Check for errors in browser console

### Database Verification

```sql
-- Check social connections
SELECT 
  platform,
  account_name,
  account_username,
  created_at,
  expires_at
FROM social_connections
WHERE org_id = 'your_org_id'
ORDER BY created_at DESC;
```

---

## ✅ Final Checklist

### Setup Complete When:

- [ ] All environment variables configured in Vercel
- [ ] All OAuth apps created in respective developer portals
- [ ] All callback URLs configured correctly in each platform
- [ ] DNS records pointing to Vercel
- [ ] Supabase redirect URLs configured
- [ ] User can sign in with Google
- [ ] User can connect Twitter account
- [ ] User can connect LinkedIn account
- [ ] User can connect Facebook account
- [ ] User can connect Instagram via Facebook
- [ ] User can connect YouTube account
- [ ] User can connect Discord account
- [ ] User can connect Reddit account
- [ ] Tokens are saved in database
- [ ] Posting to platforms works

---

## 🚀 Deployment

### After Making Changes

```bash
# 1. Commit changes
git add .
git commit -m "Fix social media OAuth flows"
git push origin main

# 2. Vercel will auto-deploy

# 3. Verify environment variables in Vercel dashboard

# 4. Test each OAuth flow in production
```

### Environment Variables Priority

Vercel environment variables override `.env.local`. Make sure production secrets are set in Vercel dashboard.

---

## 📝 Summary

**Two separate OAuth systems**:
1. **Supabase Auth** → User login → Uses `auth.timeline-alchemy.nl`
2. **Social Media OAuth** → Platform connections → Uses `www.timeline-alchemy.nl/api/auth/*`

**Key Points**:
- They don't interfere with each other
- Different callback URLs
- Different purposes
- Both fully functional after this fix ✅

**Status**:
- ✅ Supabase Auth: Already working
- ✅ Social Media OAuth: Fixed with new route handlers
- ✅ All 7 platforms supported: Twitter, LinkedIn, Facebook, Instagram, YouTube, Discord, Reddit
- ⚠️ Telegram & WordPress: Use different authentication methods (bot token / credentials)

