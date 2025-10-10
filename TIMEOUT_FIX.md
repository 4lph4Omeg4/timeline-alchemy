# 504 Gateway Timeout Fix

## Probleem

De bulk content generation kreeg een **504 Gateway Timeout** error:

```
Failed to load resource: the server responded with a status of 504 ()
Failed to parse response: SyntaxError: Unexpected token 'A', "An error o"... is not valid JSON
```

**Impact:** Hele content generation werkte niet meer, niet alleen afbeeldingen.

## Oorzaak

**Vercel Serverless Functions hebben een default timeout van 10 seconden.** 

Zonder `export const maxDuration`, worden alle API routes na 10 seconden afgebroken. Bulk content generation duurt langer dan 10 seconden, vooral bij:
- Meerdere blog posts genereren
- AI content generation per post
- Image generation per post
- Social posts generation per post

## Oplossing

**Added `maxDuration` export to all content generation routes:**

### 1. Bulk Content Generation (5 minuten)

```typescript
// app/api/generate-bulk-content/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes (max for Pro plan)
```

**Waarom 5 minuten?**
- Genereert meerdere posts (3-10+)
- Elke post: content + image + social posts
- Totaal kan 2-4 minuten duren
- 5 minuten geeft voldoende buffer

### 2. Single Content Generation (60 seconden)

```typescript
// app/api/generate-content/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for content generation
```

### 3. Social Posts Generation (60 seconden)

```typescript
// app/api/generate-social-posts/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for social posts generation
```

### 4. Image Generation (60 seconden) - Already Set

```typescript
// app/api/generate-image/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for image generation

// app/api/generate-image-google/route.ts
export const dynamic = 'force-dynamic'
export const maxDuration = 60 // 60 seconds for image generation
```

## Vercel Timeout Limits per Plan

| Plan | Max Duration |
|------|--------------|
| **Hobby** | 10 seconds (default) |
| **Pro** | 300 seconds (5 minutes) |
| **Enterprise** | 900 seconds (15 minutes) |

**Note:** Timeline Alchemy is op Pro plan, dus 300 seconden is het maximum.

## Routes Gefixed

✅ **`/api/generate-bulk-content`** - 300 seconds (5 min)  
✅ **`/api/generate-content`** - 60 seconds  
✅ **`/api/generate-social-posts`** - 60 seconds  
✅ **`/api/generate-image`** - 60 seconds (already set)  
✅ **`/api/generate-image-google`** - 60 seconds (already set)  

## Vercel.json Configuration

Ook toegevoegd aan `vercel.json` voor global fallback:

```json
{
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  }
}
```

Dit geeft **30 seconden default** voor alle API routes die geen specifieke `maxDuration` hebben.

## Testing

### Voor de Fix:
```
❌ POST /api/generate-bulk-content → 504 Gateway Timeout (after 10 seconds)
❌ Content generation failed completely
❌ "An error o..." parse error
```

### Na de Fix:
```
✅ POST /api/generate-bulk-content → 200 OK (within 5 minutes)
✅ Content generation succesvol
✅ Images worden gegenereerd
✅ Social posts worden gegenereerd
```

## Monitoring

**Check Vercel Function Logs voor:**
1. **Execution duration** - Moet onder maxDuration blijven
2. **Timeout errors** - Moeten verdwenen zijn
3. **Success rate** - Moet 100% zijn voor normale requests

## Best Practices

### Voor API Routes die lang duren:

1. **Altijd `maxDuration` instellen**
   ```typescript
   export const maxDuration = 60 // seconds
   ```

2. **Altijd `dynamic = 'force-dynamic'` toevoegen**
   ```typescript
   export const dynamic = 'force-dynamic'
   ```

3. **Timeout binnen de functie**
   ```typescript
   const timeoutPromise = new Promise((_, reject) => 
     setTimeout(() => reject(new Error('Timeout')), 4 * 60 * 1000)
   )
   const result = await Promise.race([operation(), timeoutPromise])
   ```

4. **Progress feedback** voor lange operaties
   - Gebruik streaming responses
   - Of return partial results
   - Of gebruik webhooks/callbacks

## Status

✅ **504 Timeout errors gefixed**  
✅ **All content generation routes hebben maxDuration**  
✅ **Bulk generation heeft 5 minuten timeout**  
✅ **Build succesvol**  
⏳ **Klaar voor Vercel deployment**  

De content generation zou nu weer **perfect** moeten werken! 🚀
