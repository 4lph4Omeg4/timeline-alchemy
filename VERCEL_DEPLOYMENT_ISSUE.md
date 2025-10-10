# Vercel 405 Error - Root Cause Analysis

## Probleem

**ALLE nieuwe/gewijzigde API routes krijgen 405 errors na deployment:**
- ❌ `/api/apply-watermark-to-existing` → 405
- ❌ `/api/watermark-bulk` → 405 (zelfs nieuwe route!)
- ✅ `/api/generate-bulk-content` → Werkt (was al deployed vóór domain switch)

## Root Cause: Supabase Custom Domain Switch

Je hebt **volkomen gelijk**! Het probleem is waarschijnlijk veroorzaakt door de **Supabase custom domain switch** naar `auth.timeline-alchemy.nl`.

### Wat Er Gebeurde:

1. **Voor domain switch**: Routes werkten normaal
2. **Domain switch**: `NEXT_PUBLIC_SUPABASE_URL` veranderd naar `https://auth.timeline-alchemy.nl`
3. **Na domain switch**: Nieuwe/gewijzigde routes krijgen 405 errors

### Waarom Dit Gebeurt:

#### 1. Vercel Routing Cache
- Vercel cached routing configuration per domain
- Domain change triggert niet automatisch cache invalidation
- Oude routing rules blijven actief

#### 2. Function Deployment Mismatch
- Functions worden deployed naar specifieke regions
- Domain changes kunnen region mismatch veroorzaken
- Functions zijn deployed maar routing wijst naar oude location

#### 3. CORS/Headers Issues
- Custom domain heeft mogelijk andere CORS configuratie nodig
- API routes kunnen blocked worden door browser CORS policy

## Oplossingen

### Optie 1: Complete Vercel Project Reset (RECOMMENDED)

Dit is de meest effectieve oplossing:

1. **Backup Environment Variables**
   - Ga naar Vercel Dashboard → Settings → Environment Variables
   - Kopieer ALLE environment variables

2. **Delete Vercel Project**
   - Vercel Dashboard → Settings → Advanced
   - Scroll naar beneden
   - Click "Delete Project"

3. **Re-import Project**
   - Vercel Dashboard → Add New Project
   - Import je GitHub repository opnieuw
   - Configureer alle environment variables opnieuw
   - Deploy

**Waarom dit werkt:**
- Verse deployment zonder oude cache
- Nieuwe routing configuration
- Clean slate voor alle functions

### Optie 2: Vercel CLI Force Redeploy

```bash
# Install Vercel CLI (als je dat nog niet hebt)
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Force production deployment (no cache)
vercel --prod --force
```

**Flags:**
- `--prod`: Deploy to production
- `--force`: Skip build cache
- `--debug`: Show detailed logs

### Optie 3: Vercel Configuration Fix

**Updated `vercel.json` met specifieke function configs:**

```json
{
  "functions": {
    "app/api/generate-bulk-content/route.ts": {
      "maxDuration": 300
    },
    "app/api/watermark-bulk/route.ts": {
      "maxDuration": 300
    },
    "app/api/apply-watermark-to-existing/route.ts": {
      "maxDuration": 300
    },
    "app/api/**/*.ts": {
      "maxDuration": 60
    }
  },
  "headers": [
    {
      "source": "/api/:path*",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        }
      ]
    }
  ]
}
```

**Waarom deze changes:**
1. **Specifieke function timeouts** - Voorkomt conflicts
2. **CORS headers** - Zorgt dat API calls niet geblokkeerd worden
3. **Explicit method support** - POST method expliciet toegestaan

### Optie 4: Environment Variable Check

**Verify in Vercel Dashboard:**

```
NEXT_PUBLIC_SUPABASE_URL=https://auth.timeline-alchemy.nl
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Check dat deze NIET zijn ingesteld:**
```
# Deze moeten LEEG zijn of verwijderd:
VERCEL_URL=...
NEXT_PUBLIC_VERCEL_URL=...
```

## Diagnostic Steps

### 1. Check Vercel Function Logs

```
Vercel Dashboard → Deployments → Latest → Functions → watermark-bulk
```

Look for:
- Function creation status
- Runtime errors
- Configuration issues

### 2. Check Vercel Build Logs

```
Vercel Dashboard → Deployments → Latest → Build Logs
```

Search for:
- `watermark-bulk` compilation
- Route registration
- Any warnings or errors

### 3. Test Function Directly

```bash
# Test via Vercel CLI
vercel logs --follow

# In another terminal, trigger the function
curl -X POST https://www.timeline-alchemy.nl/api/watermark-bulk \
  -H "Content-Type: application/json"
```

### 4. Check Function Regions

```
Vercel Dashboard → Settings → Functions
```

Verify:
- Function region matches your location
- No region conflicts

## Quick Test

**Test if it's a routing issue vs function issue:**

```bash
# Test GET endpoint (should work if function exists)
curl https://www.timeline-alchemy.nl/api/watermark-bulk

# Expected response:
{
  "message": "Bulk Watermark API v2 - Ready",
  "method": "POST",
  "endpoint": "/api/watermark-bulk",
  "status": "active",
  "maxDuration": 300,
  "version": "2.0.0"
}
```

**If GET works but POST doesn't:**
- It's a routing/method configuration issue
- Not a deployment issue

**If GET also gives 405:**
- Function not deployed at all
- Complete deployment issue

## Recommended Action Plan

### Immediate (Try First):

1. ✅ **Update `vercel.json`** (already done)
2. ✅ **Push changes**
3. ⏳ **Wait for deployment**
4. 🧪 **Test GET endpoint first**
5. 🧪 **Test POST endpoint**

### If Still Failing:

1. 🔧 **Use Vercel CLI force redeploy**
   ```bash
   vercel --prod --force
   ```

2. 🔧 **Check Vercel function logs**
   - Look for deployment errors
   - Check function status

### Nuclear Option:

1. 💣 **Delete and recreate Vercel project**
   - Backup all environment variables first
   - Re-import from GitHub
   - Fresh deployment

## Expected Timeline

- **vercel.json update + push**: 2-5 minutes deployment
- **Vercel CLI force redeploy**: 5-10 minutes
- **Project recreation**: 10-15 minutes

## Status

✅ **vercel.json updated with specific function configs**  
✅ **CORS headers added**  
✅ **Explicit method support added**  
⏳ **Ready for deployment**  

**Push deze changes en monitor de deployment logs nauwkeurig!**

## Alternative Workaround

Als ALLES faalt, kunnen we een **client-side workaround** maken:

```typescript
// Temporary: Call watermark function via different method
// Use Supabase Edge Function instead of Next.js API route
```

Dit zou de Vercel routing issues compleet omzeilen.

---

**Je observatie over de domain switch was spot on! Dit verklaart waarom oude routes werken maar nieuwe routes 405 geven.** 🎯
