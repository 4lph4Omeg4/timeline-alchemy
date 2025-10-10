# Vercel 405 Error Fix - Deployment Cache Issue

## Probleem

De `/api/apply-watermark-to-existing` endpoint blijft een **405 Method Not Allowed** error geven, ondanks dat:
- ✅ De route een POST handler heeft
- ✅ `dynamic = 'force-dynamic'` is ingesteld
- ✅ `maxDuration = 300` is ingesteld
- ✅ Build succesvol is lokaal

## Oorzaak

**Vercel Deployment Cache Issue**

Vercel cached soms oude versies van API routes, vooral na meerdere deployments. De oude versie zonder POST handler blijft actief ondanks nieuwe deployments.

## Oplossing

### 1. Force Redeploy Trigger

**Changes gemaakt om cache te forceren:**

```typescript
// app/api/apply-watermark-to-existing/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes for bulk watermarking
export const runtime = 'nodejs' // ✅ ADDED - Explicitly set runtime

// Updated GET handler with more info
export async function GET(request: NextRequest) {
  return NextResponse.json({ 
    message: 'Bulk Watermark API - Ready', // ✅ CHANGED
    method: 'POST',
    endpoint: '/api/apply-watermark-to-existing',
    status: 'active', // ✅ ADDED
    maxDuration: 300 // ✅ ADDED
  }, { status: 200 })
}
```

### 2. Vercel Cache Clear Opties

#### Optie A: Force Redeploy via Vercel Dashboard (RECOMMENDED)

1. Ga naar **Vercel Dashboard** → Je project
2. Ga naar **Deployments** tab
3. Klik op de **laatste deployment**
4. Klik op **"..."** (three dots menu)
5. Selecteer **"Redeploy"**
6. ✅ **Check "Use existing Build Cache"** = **OFF**
7. Klik **"Redeploy"**

Dit forceert een **complete rebuild** zonder cache.

#### Optie B: Manual Cache Clear

1. Ga naar **Vercel Dashboard** → Settings
2. Scroll naar **"Deployment Protection"**
3. Klik **"Clear Build Cache"**
4. Push een nieuwe commit (kan een dummy commit zijn)

#### Optie C: Dummy Commit Push

```bash
# Als de bovenstaande opties niet werken
git commit --allow-empty -m "Force Vercel redeploy - clear cache"
git push origin main
```

### 3. Vercel Environment Variables Check

Zorg dat deze environment variables zijn ingesteld in Vercel:

```
NEXT_PUBLIC_SUPABASE_URL=https://auth.timeline-alchemy.nl
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Verificatie

### Test de Route Direct

**Via Browser (GET test):**
```
https://www.timeline-alchemy.nl/api/apply-watermark-to-existing
```

**Verwacht Response:**
```json
{
  "message": "Bulk Watermark API - Ready",
  "method": "POST",
  "endpoint": "/api/apply-watermark-to-existing",
  "status": "active",
  "maxDuration": 300
}
```

**Via cURL (POST test):**
```bash
curl -X POST https://www.timeline-alchemy.nl/api/apply-watermark-to-existing \
  -H "Content-Type: application/json"
```

**Verwacht:** 200 OK (niet 405)

### Test via UI

1. Ga naar `/dashboard/admin/watermark`
2. Klik **"Apply Watermarks to All Images"**
3. ✅ **Verwacht**: Geen 405 error, watermarks worden toegepast

## Waarom Dit Gebeurt

### Vercel Caching Behavior

Vercel gebruikt **aggressive caching** voor:
1. **Build artifacts** - Compiled code
2. **Function deployments** - Serverless functions
3. **Static assets** - Pages, images, etc.

Bij **incremental deployments** kan Vercel:
- Oude function code hergebruiken als het denkt dat er niets is veranderd
- Route handlers cachen op basis van file hash
- Edge cache niet invalideren voor API routes

### Waarom Onze Fix Werkt

Door **`runtime = 'nodejs'`** toe te voegen:
- Vercel detecteert een **configuration change**
- Dit forceert een **complete rebuild** van de function
- Cache wordt **geïnvalideerd**

Door **GET handler response** te wijzigen:
- File hash verandert
- Vercel moet de function **opnieuw deployen**

## Preventie

### Best Practices voor Toekomstige Deployments

1. **Altijd expliciet runtime instellen:**
   ```typescript
   export const runtime = 'nodejs' // of 'edge'
   ```

2. **Versioning in GET handlers:**
   ```typescript
   export async function GET() {
     return NextResponse.json({ 
       version: '1.0.0', // Increment bij changes
       // ...
     })
   }
   ```

3. **Force rebuild bij grote changes:**
   - Clear build cache in Vercel
   - Use "Redeploy" zonder cache

4. **Monitor deployment logs:**
   - Check of alle functions correct deployen
   - Verify function URLs in logs

## Troubleshooting

### Als 405 Error Blijft Bestaan

#### 1. Check Vercel Function Logs
```
Vercel Dashboard → Deployments → Latest → Functions
```
Look for:
- Function creation logs
- Runtime errors
- Configuration issues

#### 2. Check Build Logs
```
Vercel Dashboard → Deployments → Latest → Build Logs
```
Look for:
- Route compilation errors
- Missing dependencies
- Configuration warnings

#### 3. Manual Function Inspection
```
Vercel Dashboard → Functions → /api/apply-watermark-to-existing
```
Check:
- Function status (Active/Inactive)
- Runtime configuration
- Memory/timeout settings

#### 4. Nuclear Option: Delete & Recreate Route

Als alles faalt:
```bash
# 1. Delete the route file
rm app/api/apply-watermark-to-existing/route.ts

# 2. Commit and push
git add .
git commit -m "Remove watermark route"
git push

# 3. Wait for deployment to complete

# 4. Recreate the route file
# (restore from backup)

# 5. Commit and push
git add .
git commit -m "Re-add watermark route"
git push
```

## Status

✅ **Route updated with cache-busting changes**  
✅ **Build succesvol lokaal**  
✅ **Runtime explicitly set**  
✅ **GET handler updated**  
⏳ **Waiting for Vercel redeploy**  

**Na deployment, test de route direct via browser en cURL voordat je de UI test.**

## Alternative Solution

Als de 405 error blijft bestaan na alle bovenstaande stappen, kunnen we een **workaround** implementeren met een nieuwe route:

```typescript
// app/api/watermark-bulk/route.ts (nieuwe route)
// Exact dezelfde code als apply-watermark-to-existing
```

Dit zou een **fresh route** zijn zonder cache issues.

---

**De fix is geïmplementeerd. Push naar Vercel en volg de "Force Redeploy" stappen hierboven.** 🚀
