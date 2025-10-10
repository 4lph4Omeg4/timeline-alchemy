# Vercel 405 Error - Nuclear Option Analysis

## Situatie

**ALLE nieuwe/gewijzigde API routes krijgen persistente 405 errors:**
- ❌ `/api/apply-watermark-to-existing` → 405
- ❌ `/api/watermark-bulk` → 405
- ❌ `/api/admin/watermark-process` → 405 (zelfs compleet nieuwe route!)
- ✅ `/api/generate-bulk-content` → Werkt (oude route)

## Mogelijke Root Causes

### 1. Vercel Routing Cache (Meest Waarschijnlijk)

**Symptomen:**
- Oude routes werken
- Nieuwe routes krijgen 405
- Begon na Supabase domain switch

**Verklaring:**
Vercel heeft een **routing manifest** dat tijdens build wordt gegenereerd. Na een domain switch kan dit manifest corrupt raken.

### 2. Path Pattern Matching Issue

**Symptomen:**
- Specifieke path patterns werken niet
- Build toont route als λ (Dynamic) maar Vercel serveert het niet

**Verklaring:**
Vercel's path matching kan conflicts hebben met bepaalde route namen.

### 3. Environment Variable Mismatch

**Symptomen:**
- Routes compileren correct
- Runtime deployment faalt

**Verklaring:**
Environment variables in Vercel verschillen van local, waardoor routes falen tijdens initialization.

## Oplossingen (In volgorde van severity)

### Oplossing 1: Vercel Cache Complete Clear ⭐ PROBEER DIT EERST

**Via Vercel Dashboard:**

1. **Clear Function Cache:**
   ```
   Vercel Dashboard → Settings → Functions → Clear Function Cache
   ```

2. **Clear Build Cache:**
   ```
   Vercel Dashboard → Settings → General → Clear Build Cache
   ```

3. **Force Redeploy:**
   ```
   Deployments → Latest → "..." menu → Redeploy
   ✅ UNCHECK "Use existing Build Cache"
   ```

### Oplossing 2: Vercel CLI Deployment

```bash
# Install Vercel CLI (if not installed)
npm i -g vercel

# Login
vercel login

# Link to project
vercel link

# Deploy with complete cache clear
vercel --prod --force --no-cache

# Alternative: Deploy to preview first
vercel --force --no-cache
# Then promote to production if it works
```

**Flags:**
- `--force`: Skip all caches
- `--no-cache`: Clear build cache
- `--prod`: Deploy to production
- `--debug`: Show detailed logs

### Oplossing 3: Environment Variable Check

**In Vercel Dashboard → Settings → Environment Variables:**

**Verify deze zijn CORRECT:**
```bash
NEXT_PUBLIC_SUPABASE_URL=https://auth.timeline-alchemy.nl  # ✅ Updated
NEXT_PUBLIC_APP_URL=https://www.timeline-alchemy.nl        # ✅ Correct
SUPABASE_SERVICE_ROLE_KEY=your_key                          # ✅ Set
```

**Delete deze als ze bestaan:**
```bash
VERCEL_URL  # ❌ Remove if exists
NEXT_PUBLIC_VERCEL_URL  # ❌ Remove if exists
```

**Then redeploy!**

### Oplossing 4: Edge Runtime Test

Probeer **Edge Runtime** in plaats van Node.js:

```typescript
// app/api/admin/watermark-process/route.ts
export const runtime = 'edge' // Changed from 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300
```

**Waarom dit zou kunnen werken:**
- Edge functions gebruiken andere deployment pipeline
- Andere caching mechanisme
- Andere routing layer

### Oplossing 5: Simplified vercel.json

**Remove complexity, keep it simple:**

```json
{
  "buildCommand": "npm run build",
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps"
}
```

**Remove:**
- Function-specific configs (let Next.js handle it)
- Headers config (let Next.js handle it)
- Build env config (if not needed)

### Oplossing 6: Test Without Body

Misschien is het een body parsing issue:

```typescript
// Test: Remove body parsing completely
export async function POST() {
  // Don't use request parameter at all
  return NextResponse.json({ 
    success: true, 
    message: 'Test response' 
  })
}
```

Als dit werkt, is het een body parsing issue.

### Oplossing 7: SQL-based Workaround (ALTERNATIEF)

Als ALLES faalt, kunnen we de watermarking via een **Supabase Edge Function** of **SQL script** doen:

```sql
-- Apply watermarks via SQL
-- Use this as ultimate fallback
```

## Diagnostic Commands

### 1. Check Vercel Deployment Status

```bash
vercel ls
```

### 2. Check Function Logs

```bash
vercel logs --follow
```

### 3. Inspect Specific Function

```bash
vercel inspect <deployment-url>
```

### 4. Test Local vs Production

```bash
# Local (should work)
npm run dev
# Then test: http://localhost:3000/api/admin/watermark-process

# Production (gives 405)
curl https://www.timeline-alchemy.nl/api/admin/watermark-process
```

## Debugging Strategy

### Step 1: Simplify Everything

**Maak een SUPER SIMPELE test route:**

```typescript
// app/api/test-simple/route.ts
export const dynamic = 'force-dynamic'

export async function POST() {
  return Response.json({ ok: true })
}

export async function GET() {
  return Response.json({ ok: true })
}
```

**Test dit:**
- Als dit WEL werkt → Het probleem is in de complexe watermark logic
- Als dit NIET werkt → Het probleem is fundamenteel met Vercel deployment

### Step 2: Check Vercel Logs

```
Vercel Dashboard → Deployments → Latest → Runtime Logs
```

Filter op: `watermark`

Look for:
- Function initialization errors
- Runtime errors
- Module loading errors

### Step 3: Compare Working vs Non-Working Routes

**Working:** `/api/generate-bulk-content`
**Not Working:** `/api/admin/watermark-process`

**Differences:**
- Path structure?
- Import statements?
- Handler signature?
- Dependencies?

## Immediate Action Items

1. ✅ **Try simplified vercel.json** (remove complexity)
2. ✅ **Try edge runtime** instead of nodejs
3. ✅ **Clear ALL Vercel caches** (function + build)
4. ✅ **Force redeploy without cache**
5. 🧪 **Test super simple route first**
6. 📊 **Check Vercel function logs**

## Status

🔴 **Critical Issue**: Vercel routing completely broken for new routes  
⚠️ **Impact**: Cannot deploy new API endpoints  
🎯 **Focus**: Find root cause, not workaround  
⏳ **Need**: Vercel CLI force deployment or cache clear  

**This is a Vercel platform issue, not a code issue. The routes work locally.** 

---

**Recommended Next Steps:**

1. Try the simplified vercel.json (I'll update it)
2. Do a Vercel CLI force deployment: `vercel --prod --force --no-cache`
3. If that doesn't work, contact Vercel support - this might be a platform bug related to the domain switch

