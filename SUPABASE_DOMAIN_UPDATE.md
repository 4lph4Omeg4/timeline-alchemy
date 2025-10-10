# Supabase Custom Domain Update

## ⚠️ BELANGRIJKE UPDATE NODIG

Gebaseerd op je Supabase dashboard screenshot toont de **Project URL** als `https://auth.timeline-alchemy.nl` met "Custom domain active".

Dit betekent dat je environment variables **MUST** worden bijgewerkt!

## 🔄 Environment Variables Update

### In Vercel Dashboard:

**Wijzig van:**
```bash
# ❌ OUDE SETTINGS
NEXT_PUBLIC_SUPABASE_URL=https://kjjrzhicspmbiitayrco.supabase.co
```

**Naar:**
```bash
# ✅ NIEUWE SETTINGS  
NEXT_PUBLIC_SUPABASE_URL=https://auth.timeline-alchemy.nl
```

### Alle Environment Variables:

```bash
# Supabase - UPDATED!
NEXT_PUBLIC_SUPABASE_URL=https://auth.timeline-alchemy.nl
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# App URLs
NEXT_PUBLIC_APP_URL=https://www.timeline-alchemy.nl
NEXT_PUBLIC_SITE_URL=https://www.timeline-alchemy.nl

# Auth Callbacks
NEXT_PUBLIC_SUPABASE_REDIRECT_URL=https://auth.timeline-alchemy.nl/auth/v1/callback
NEXT_PUBLIC_AUTH_CALLBACK_URL=https://auth.timeline-alchemy.nl/auth/v1/callback
```

## 🎯 Waarom Deze Update?

### Custom Domain Configuration

Je Supabase project is geconfigureerd met:
- **Primary Domain**: `kjjrzhicspmbiitayrco.supabase.co` (interne Supabase URL)
- **Custom Domain**: `auth.timeline-alchemy.nl` (jouw mooie URL)

### API Endpoints

Met custom domain active, alle API calls moeten naar:
```
https://auth.timeline-alchemy.nl/rest/v1/
https://auth.timeline-alchemy.nl/auth/v1/
```

In plaats van:
```
https://kjjrzhicspmbiitayrco.supabase.co/rest/v1/
https://kjjrzhicspmbiitayrco.supabase.co/auth/v1/
```

## 🔧 Update Stappen

### 1. Update Vercel Environment Variables

1. Ga naar: https://vercel.com/dashboard
2. Selecteer je Timeline Alchemy project
3. Ga naar Settings → Environment Variables
4. Update `NEXT_PUBLIC_SUPABASE_URL`:
   - **Van**: `https://kjjrzhicspmbiitayrco.supabase.co`
   - **Naar**: `https://auth.timeline-alchemy.nl`

### 2. Update Local Development (.env.local)

```bash
# Update je lokale .env.local file
NEXT_PUBLIC_SUPABASE_URL=https://auth.timeline-alchemy.nl
```

### 3. Redeploy

```bash
# Commit changes
git add .
git commit -m "Update Supabase URL to custom domain"
git push origin main

# Vercel auto-deploys
```

## 🧪 Test na Update

### 1. Test Database Connection

```bash
# Test API endpoint
curl https://auth.timeline-alchemy.nl/rest/v1/
```

### 2. Test Authentication

1. Ga naar `https://www.timeline-alchemy.nl/auth/signin`
2. Test Google OAuth login
3. Verify redirect naar `/dashboard`

### 3. Test Database Queries

Check of alle database operaties nog werken:
- Portfolio pagina
- Dashboard data
- Social connections
- Content creation

## 🔍 Verification

### Check Supabase Connection

Na de update, controleer in browser console of je ziet:
```
✅ Supabase connected to: https://auth.timeline-alchemy.nl
```

### Check API Calls

In Network tab zou je moeten zien:
```
✅ API calls naar: https://auth.timeline-alchemy.nl/rest/v1/...
```

## ⚠️ Troubleshooting

### Als er errors zijn:

1. **Check DNS**: `auth.timeline-alchemy.nl` moet naar Supabase wijzen
2. **Check SSL**: Custom domain moet geldig SSL certificaat hebben
3. **Check CORS**: Supabase moet je app domain toestaan

### Fallback Option

Als custom domain problemen geeft, kun je terug naar:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://kjjrzhicspmbiitayrco.supabase.co
```

En custom domain uitschakelen in Supabase dashboard.

## 📋 Checklist

- [ ] Update `NEXT_PUBLIC_SUPABASE_URL` in Vercel
- [ ] Update `.env.local` voor local development  
- [ ] Deploy naar production
- [ ] Test authentication flow
- [ ] Test database queries
- [ ] Test portfolio pagina
- [ ] Test social connections
- [ ] Verify alle features werken

## 🎯 Resultaat

Na deze update:
- ✅ Alle API calls gaan naar `auth.timeline-alchemy.nl`
- ✅ Mooiere URLs in je app
- ✅ Consistent branding
- ✅ Custom domain volledig actief

**Status**: Update vereist voor correcte werking! 🚀
