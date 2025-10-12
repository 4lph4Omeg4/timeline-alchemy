# Facebook Pages Not Showing - Troubleshooting Guide

## Current Issue
User is Admin/Manager of pages but they don't show up in `/me/accounts` API call.

## Possible Causes & Solutions

### 1. **App in Development Mode - Test Users Required**

**Problem:** If your Facebook App is in Development Mode, it can only access pages where test users are admins.

**Solution:**
1. Go to: https://developers.facebook.com/apps/YOUR_APP_ID/roles/test-users
2. Add yourself as a Test User
3. OR switch app to Live Mode (requires App Review for production)

**For now:** Add yourself as Tester:
- Meta for Developers → Your App → Roles → Test Users
- Add your Facebook account

---

### 2. **Pages Connected to Business Account**

**Problem:** Pages managed through a Business Account might not show in personal `/me/accounts`.

**Check:**
1. Are "The Chosen Ones" and "Timeline-Alchemy" connected to a Facebook Business Account?
2. Go to: https://business.facebook.com → Business Settings → Pages
3. If yes, you might need to use Business Manager API instead

**Workaround:**
- Make sure your personal Facebook account has direct admin access to the pages
- Not just through Business Manager

---

### 3. **Permission Not Granted During OAuth**

**Problem:** User didn't grant `pages_show_list` permission during authorization.

**Solution:**
1. Disconnect Facebook in Timeline Alchemy
2. Clear Facebook authorization: https://www.facebook.com/settings?tab=business_tools
   - Find "Timeline Alchemy" → Remove
3. Connect again and make sure to grant ALL permissions

---

### 4. **Pages Need to be Published**

**Problem:** Unpublished pages might not appear in API.

**Check:**
- Go to each page
- Settings → General → Page Visibility
- Make sure pages are "Published"

---

### 5. **App Not Added to Business Manager**

**Problem:** If pages are in Business Manager, the app needs to be added there.

**Solution:**
1. Go to: https://business.facebook.com
2. Business Settings → Apps
3. Add your Timeline Alchemy app
4. Grant it access to the pages

---

### 6. **Token Inspection**

**Test your current token:**

```bash
# Get your user ID from Timeline Alchemy dashboard
# Then visit:
https://www.timeline-alchemy.nl/api/facebook/test-token?user_id=YOUR_USER_ID
```

This shows:
- User info
- Granted permissions
- Available pages

**Or test directly with Facebook's Token Debugger:**
1. Go to: https://developers.facebook.com/tools/debug/accesstoken/
2. Paste your access token (get from database)
3. Check which permissions are granted

---

## Quick Fix Steps

### Step 1: Remove Old Authorization
```
1. Go to: https://www.facebook.com/settings?tab=business_tools
2. Find "Timeline Alchemy"
3. Click "Remove"
```

### Step 2: Add as Test User (if in Development Mode)
```
1. Go to: https://developers.facebook.com/apps/YOUR_APP_ID/roles/test-users
2. Add your account
```

### Step 3: Check Page Roles
```
1. Go to: https://www.facebook.com/pages
2. For each page (The Chosen Ones, Timeline-Alchemy):
   - Settings → Page Access
   - Make sure YOU (not just Business Manager) have Admin access
```

### Step 4: Reconnect in Timeline Alchemy
```
1. Dashboard → Socials
2. Disconnect Facebook (if connected)
3. Connect Facebook again
4. Grant ALL permissions
```

---

## Meta App Settings Checklist

### Required Settings:
- ✅ App Domain: `timeline-alchemy.nl`
- ✅ Valid OAuth Redirect URIs:
  - `https://www.timeline-alchemy.nl/api/auth/facebook/callback`
  - `https://www.timeline-alchemy.nl/api/auth/instagram/callback`
- ✅ Products Added:
  - Facebook Login
  - Facebook Pages
- ✅ Permissions Requested:
  - `public_profile`
  - `pages_show_list`
  - `pages_read_engagement`
  - `pages_manage_posts`

### App Mode:
**Development Mode:**
- Only test users can use the app
- No review needed
- **You must add yourself as test user**

**Live Mode:**
- Anyone can use
- Requires App Review for advanced permissions
- Better for production

---

## API Testing

### Test 1: Check Permissions
```bash
curl "https://graph.facebook.com/v18.0/me/permissions?access_token=YOUR_TOKEN"
```

Should show:
```json
{
  "data": [
    { "permission": "public_profile", "status": "granted" },
    { "permission": "pages_show_list", "status": "granted" },
    { "permission": "pages_read_engagement", "status": "granted" },
    { "permission": "pages_manage_posts", "status": "granted" }
  ]
}
```

### Test 2: Get Pages
```bash
curl "https://graph.facebook.com/v18.0/me/accounts?access_token=YOUR_TOKEN"
```

Should return your pages.

---

## Most Likely Issue

**For Development Mode apps:**
The #1 issue is that the Facebook user needs to be added as a **Test User** or **Developer** of the app.

Go to: https://developers.facebook.com/apps/YOUR_APP_ID/roles/
- Add yourself under "Roles" or "Test Users"
- Then reconnect Facebook in Timeline Alchemy

---

## Still Not Working?

Contact me and provide:
1. Screenshot of Meta App → Roles → Developers/Test Users
2. Screenshot of Meta App → App Review → Permissions
3. Output of: `https://www.timeline-alchemy.nl/api/facebook/test-token?user_id=YOUR_USER_ID`

