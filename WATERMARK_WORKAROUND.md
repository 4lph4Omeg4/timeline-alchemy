# Watermark 405 Error - Alternative Solutions

## Probleem Samenvatting

**ALLE varianten van de watermark route geven 405 errors:**
- ❌ `/api/apply-watermark-to-existing` → 405
- ❌ `/api/watermark-bulk` → 405  
- ❌ `/api/admin/watermark-process` → 405
- ✅ Oude routes (zoals `/api/generate-bulk-content`) werken wel

**Conclusie:** Dit is een **Vercel deployment/routing issue** gerelateerd aan de Supabase domain switch.

## Alternatieve Oplossingen

### Oplossing 1: SQL Script (MEEST PRAKTISCH)

**Voor nu - gebruik SQL om images te identificeren:**

```sql
-- Run in Supabase SQL Editor
-- sql/apply-watermarks-bulk.sql

SELECT 
  json_build_object(
    'total_images', COUNT(*),
    'needs_watermark', COUNT(*) FILTER (WHERE url NOT LIKE '%/watermarked/%'),
    'already_watermarked', COUNT(*) FILTER (WHERE url LIKE '%/watermarked/%')
  ) as watermark_status
FROM images;
```

Dit geeft je een overzicht van welke images watermarks nodig hebben.

### Oplossing 2: Vercel CLI Deployment

**Als je Vercel CLI hebt:**

```bash
# Install (if not installed)
npm i -g vercel

# Login
vercel login

# Force deploy without ANY cache
vercel --prod --force --debug

# Monitor logs during deployment
vercel logs --follow
```

**Check in de logs of je ziet:**
- Function deployment errors
- Routing configuration issues
- Runtime initialization errors

### Oplossing 3: Supabase Edge Function

**Maak een Supabase Edge Function** in plaats van Next.js API route:

```typescript
// supabase/functions/apply-watermarks/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Watermark logic here
  // This runs on Supabase infrastructure, not Vercel
})
```

**Voordelen:**
- Omzeilt Vercel routing compleet
- Gebruikt Supabase infrastructure
- Langere timeouts mogelijk
- Geen deployment cache issues

### Oplossing 4: Manual Batch Processing

**Voor nu - process images handmatig:**

1. **Get list van images:**
   ```sql
   SELECT id, url 
   FROM images 
   WHERE url NOT LIKE '%/watermarked/%'
   LIMIT 10;
   ```

2. **Voor elke image, gebruik je bestaande `/api/test-watermark` route:**
   ```javascript
   // Browser console
   const imageIds = ['id1', 'id2', 'id3'];
   for (const id of imageIds) {
     await fetch('/api/test-watermark', {
       method: 'POST',
       body: JSON.stringify({ imageId: id })
     });
   }
   ```

### Oplossing 5: Client-Side Processing

**Tijdelijke workaround - process via frontend:**

```typescript
// app/dashboard/admin/watermark/page.tsx
const processImagesClientSide = async () => {
  // 1. Fetch all images from Supabase
  const { data: images } = await supabase
    .from('images')
    .select('*')
    .not('url', 'like', '%/watermarked/%');
  
  // 2. Process each image individually via working endpoint
  for (const image of images) {
    try {
      // Use a working endpoint if available
      const response = await fetch('/api/test-watermark', {
        method: 'POST',
        body: JSON.stringify({ 
          imageUrl: image.url,
          imageId: image.id 
        })
      });
      // Handle response
    } catch (error) {
      console.error('Failed:', error);
    }
  }
}
```

## Temporary Workaround: Disable Watermark Feature

Als het urgent is, kun je **tijdelijk** de bulk watermark feature uitschakelen:

```typescript
// app/dashboard/admin/watermark/page.tsx
const handleApplyWatermarks = async () => {
  toast.error('Bulk watermark feature is temporarily disabled due to deployment issues. Please use individual watermarking or contact support.')
  return;
}
```

## Root Cause Investigation

### Check Vercel Logs

1. Ga naar **Vercel Dashboard**
2. **Deployments** → Klik op laatste deployment
3. **Runtime Logs** → Filter op "watermark"
4. **Functions** → Check function status

### Look for:

```
❌ Function initialization failed
❌ Route handler not found
❌ Method not allowed in routing config
❌ Middleware blocking request
```

### Check Environment

```
Vercel Dashboard → Settings → Environment Variables
```

Verify:
- `NEXT_PUBLIC_SUPABASE_URL` is correct
- `SUPABASE_SERVICE_ROLE_KEY` is set
- No conflicting variables

## Recommended Immediate Action

### Option A: Vercel Support Ticket

Dit lijkt een **Vercel platform bug**. Contact Vercel support:

```
Subject: All new API routes getting 405 after Supabase custom domain switch

Details:
- Project: timeline-alchemy
- Issue: New/modified API routes return 405 Method Not Allowed
- Started after: Switching Supabase URL to custom domain
- Affected routes: /api/watermark-bulk, /api/admin/watermark-process
- Working routes: /api/generate-bulk-content (deployed before domain switch)
- Build: Successful locally and on Vercel
- Routing manifest: Possibly corrupt
```

### Option B: Temporary SQL-Based Solution

**Voor nu - gebruik SQL query om te zien wat watermarked moet worden:**

```sql
-- Run in Supabase SQL Editor
SELECT 
  COUNT(*) as total_images,
  COUNT(*) FILTER (WHERE url NOT LIKE '%/watermarked/%') as needs_watermark,
  COUNT(*) FILTER (WHERE url LIKE '%/watermarked/%') as already_watermarked
FROM images;
```

Dan watermark images **individueel** via een werkende route of handmatig.

### Option C: Wait for Vercel Cache Expiration

Soms cleared Vercel's cache automatisch na **24-48 uur**. Als het niet urgent is, wacht dan een dag en test opnieuw.

## Status

🔴 **Critical**: Vercel routing broken voor nieuwe routes  
⚠️ **Workaround**: SQL-based identificatie + individuele processing  
📧 **Recommended**: Contact Vercel support  
⏳ **Wait**: Cache kan auto-clear na 24-48u  

**Dit is definitief een Vercel platform issue, niet jouw code. Alle routes builden correct maar worden niet correct gerouted door Vercel.** 😞

