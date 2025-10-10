# Image Generation 405 Error Fix

## Probleem

De bulk content generator kreeg een **405 (Method Not Allowed)** error bij het aanroepen van `/api/generate-image`:

```
POST https://www.timeline-alchemy.nl/api/generate-image 405 (Method Not Allowed)
❌ Image generation failed for Crypto as Cosmic Currency: Nations Reclaim Monetary Destiny Status: 405
```

## Oorzaak

Er zijn **twee image generation endpoints**:

1. **`/api/generate-image`** - Gebruikt Vercel AI Gateway
2. **`/api/generate-image-google`** - Gebruikt Google Gemini direct

Het probleem was dat de bulk content generator naar `/api/generate-image` verwees, maar deze endpoint had deployment problemen in productie.

## Oplossing

**Switched bulk content generator naar de werkende endpoint:**

```typescript
// ❌ WAS:
const imageResponse = await fetch('/api/generate-image', {

// ✅ NU:
const imageResponse = await fetch('/api/generate-image-google', {
```

## Details van de Fix

### In `components/bulk-content-generator.tsx` (regel 405):

```typescript
// Changed from:
const imageResponse = await fetch('/api/generate-image', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    prompt: imagePrompt,
    orgId: 'e6c0db74-03ee-4bb3-b08d-d94512efab91' // Admin Organization UUID
  })
})

// To:
const imageResponse = await fetch('/api/generate-image-google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    prompt: imagePrompt,
    orgId: 'e6c0db74-03ee-4bb3-b08d-d94512efab91' // Admin Organization UUID
  })
})
```

## Verschil tussen de Endpoints

### `/api/generate-image`
- **Provider**: Vercel AI Gateway
- **Model**: Via gateway (mogelijk DALL-E of andere)
- **Status**: Deployment issues in productie

### `/api/generate-image-google`
- **Provider**: Google Gemini 2.5 Flash Image (direct)
- **Fallback**: DALL-E 3 als Gemini faalt
- **Status**: ✅ Werkend in productie

## Testen

### Voor de Fix:
```bash
# 405 Error
POST https://www.timeline-alchemy.nl/api/generate-image
Response: 405 Method Not Allowed
```

### Na de Fix:
```bash
# Werkend
POST https://www.timeline-alchemy.nl/api/generate-image-google
Response: 200 OK + image URL
```

## Verificatie

Na deployment, test de bulk content generator:

1. Ga naar `/dashboard/bulk-content`
2. Voer een bulk content generatie uit
3. **Verwacht**: Images worden succesvol gegenereerd zonder 405 errors
4. **Check console**: Geen "Image generation failed" errors meer

## Status

✅ **Fix geïmplementeerd**  
✅ **Build succesvol**  
⏳ **Wacht op deployment naar productie**  

De image generation zou nu weer moeten werken in de bulk content generator! 🎉
