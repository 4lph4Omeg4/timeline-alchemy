# Twitter/X OAuth Troubleshooting Guide

## Common Error: "Something went wrong - You weren't able to give access to the App"

This error typically comes from Twitter's OAuth system. Here's how to fix it:

---

## ✅ Step 1: Check Redirect URI (MOST COMMON ISSUE)

Twitter is **extremely strict** about redirect URIs. They must match **EXACTLY**.

### In Twitter Developer Portal:
1. Go to your app → **Settings** → **User authentication settings**
2. Under **OAuth 2.0 Settings**, check **Callback URI / Redirect URL**

### Must be EXACTLY one of:
- Production: `https://www.timeline-alchemy.nl/api/auth/twitter/callback`
- Development: `http://localhost:3000/api/auth/twitter/callback`

### ❌ Common Mistakes:
- ❌ Missing `www.`
- ❌ Using `http://` instead of `https://` (or vice versa)
- ❌ Trailing slash at the end: `/callback/`
- ❌ Wrong subdomain
- ❌ Missing `/api/auth/twitter/callback` path

---

## ✅ Step 2: Check App Permissions

### In Twitter Developer Portal:
1. Go to your app → **Settings** → **User authentication settings**
2. Click **"Set up"** or **"Edit"** if already configured

### Required Settings:
- **App permissions**: `Read and Write` (or `Read and Write and Direct Messages`)
- **Type of App**: `Web App, Automated App or Bot`
- **OAuth 2.0**: Must be **enabled** (toggle on)

### Scopes Required:
The app requests these scopes:
- ✅ `tweet.read` - Read tweets
- ✅ `tweet.write` - Post tweets
- ✅ `users.read` - Read user profile
- ✅ `offline.access` - Refresh tokens

Make sure your app has permissions for all these scopes.

---

## ✅ Step 3: Verify Environment Variables

In your `.env` file:

```env
# Twitter/X OAuth Credentials
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_actual_client_id_here
TWITTER_CLIENT_SECRET=your_actual_client_secret_here

# App URL (must match redirect URI domain)
NEXT_PUBLIC_APP_URL=https://www.timeline-alchemy.nl
```

### How to get these:
1. Go to Twitter Developer Portal
2. Select your app
3. Go to **Keys and tokens** tab
4. **OAuth 2.0 Client ID and Client Secret** section
5. Copy both values

### ⚠️ Important:
- Client ID is **public** (starts with something like `bWdqX...`)
- Client Secret is **private** (keep it secret!)
- After changing `.env`, **restart your dev server**

---

## ✅ Step 4: Check App Status

### In Twitter Developer Portal:
1. Make sure your app is **not suspended**
2. Check if your **Developer Account** is in good standing
3. Verify your app has **OAuth 2.0** enabled (not OAuth 1.0a)

---

## ✅ Step 5: Test with Improved Error Logging

I've updated the callback to show more detailed errors. Next time you try to connect:

1. Open browser DevTools (F12) → Console tab
2. Try connecting Twitter/X
3. Check the console logs for detailed error messages
4. The error will also be shown in the dashboard after redirect

The logs will show:
- Exact error code from Twitter
- Error description
- All OAuth parameters received

---

## 🔧 Quick Fix Checklist

Run through this checklist:

- [ ] Redirect URI in Twitter Portal matches exactly: `https://www.timeline-alchemy.nl/api/auth/twitter/callback`
- [ ] App permissions are set to "Read and Write"
- [ ] OAuth 2.0 is enabled (not OAuth 1.0a)
- [ ] Type of App is "Web App, Automated App or Bot"
- [ ] `NEXT_PUBLIC_TWITTER_CLIENT_ID` is set in `.env`
- [ ] `TWITTER_CLIENT_SECRET` is set in `.env`
- [ ] `NEXT_PUBLIC_APP_URL` matches your redirect URI domain
- [ ] Dev server restarted after changing `.env`
- [ ] App is not suspended in Twitter Developer Portal

---

## 📝 Still Not Working?

1. **Check the browser console** for error logs
2. **Check server logs** (terminal where `npm run dev` is running)
3. Look for the error message after redirect to `/dashboard/socials?error=...`
4. Try the connection again and note the exact error message

### Common Error Messages:

| Error | Meaning | Solution |
|-------|---------|----------|
| `redirect_uri_mismatch` | Redirect URI doesn't match | Fix redirect URI in Twitter Portal |
| `invalid_client` | Client ID or Secret is wrong | Check credentials in `.env` |
| `unauthorized_client` | App doesn't have required permissions | Enable OAuth 2.0 in Twitter Portal |
| `access_denied` | User declined authorization | User needs to approve the connection |
| `invalid_scope` | App doesn't have permission for requested scopes | Update app permissions in Twitter Portal |

---

## 🎯 Working Configuration Example

Here's what a working configuration looks like:

### Twitter Developer Portal Settings:
```
App Settings → User authentication settings

✅ OAuth 2.0 is ON
✅ App permissions: Read and Write
✅ Type of App: Web App, Automated App or Bot
✅ Callback URI: https://www.timeline-alchemy.nl/api/auth/twitter/callback
✅ Website URL: https://www.timeline-alchemy.nl
```

### .env File:
```env
NEXT_PUBLIC_TWITTER_CLIENT_ID=bWdqX1234567890abcdef
TWITTER_CLIENT_SECRET=SuperSecretKey123456789
NEXT_PUBLIC_APP_URL=https://www.timeline-alchemy.nl
```

---

## 💡 Pro Tips

1. **Use the exact same domain everywhere**
   - Same in Twitter Portal
   - Same in `.env` (`NEXT_PUBLIC_APP_URL`)
   - Same when accessing your app

2. **For local development**
   - Use `http://localhost:3000` (with http, not https)
   - Add `http://localhost:3000/api/auth/twitter/callback` to Twitter Portal
   - Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` in `.env`

3. **After any Twitter Portal changes**
   - Wait a few minutes for changes to propagate
   - Clear your browser cache/cookies
   - Try again

4. **Multiple environments?**
   - Add multiple callback URIs in Twitter Portal (one per line)
   - Use different `.env` files for dev/production

---

Good luck! 🚀

