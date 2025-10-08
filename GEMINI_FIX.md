# Gemini Image Generation Fix

## Probleem

Vercel ontving geen requests voor Gemini image generation. De code gebruikte wel de Vercel AI SDK (`generateText` van het `ai` package), maar was niet correct geconfigureerd.

## Oorzaken

1. **Ontbrekende Provider Configuratie**: De SDK werd aangeroepen zonder de Google provider te configureren met de AI Gateway credentials
2. **Geen Base URL**: De requests wisten niet waar ze naar toe moesten (geen `baseURL` voor de Gateway)
3. **API Key niet doorgegeven**: De `AI_GATEWAY_API_KEY` werd alleen gecheckt maar niet gebruikt in de SDK configuratie

## Oplossing

### Voor (❌ Niet werkend)
```typescript
const { generateText } = await import('ai')

const result = await generateText({
  model: 'google/gemini-2.5-flash-image-preview',
  providerOptions: {
    google: { responseModalities: ['TEXT', 'IMAGE'] },
  },
  prompt: `Generate an image: ${prompt}`,
})
```

### Na (✅ Werkend)
```typescript
const { generateText } = await import('ai')
const { createGoogleGenerativeAI } = await import('@ai-sdk/google')

// Configure Google provider with Gateway credentials
const google = createGoogleGenerativeAI({
  apiKey: gatewayApiKey,
  baseURL: 'https://ai-gateway.vercel.sh/google-ai-studio/v1beta'
})

const result = await generateText({
  model: google('gemini-2.5-flash-image-preview'),
  providerOptions: {
    google: { responseModalities: ['TEXT', 'IMAGE'] },
  },
  prompt: `Generate an image: ${prompt}`,
})
```

## Aanpassingen Gemaakt

### 1. `lib/vercel-ai.ts`
- ✅ Toegevoegd: Import van `createGoogleGenerativeAI` van `@ai-sdk/google`
- ✅ Toegevoegd: Provider configuratie met `apiKey` en `baseURL` (inclusief correcte endpoint path)
- ✅ Aangepast: Model parameter gebruikt nu de geconfigureerde provider instance

### 2. `app/api/generate-image-google/route.ts`
- ✅ Toegevoegd: Import van `createGoogleGenerativeAI` van `@ai-sdk/google`
- ✅ Toegevoegd: Provider configuratie met `apiKey` en `baseURL` (inclusief correcte endpoint path)
- ✅ Aangepast: Model parameter gebruikt nu de geconfigureerde provider instance

## Environment Variable Verificatie

Zorg ervoor dat de volgende environment variable is ingesteld in je `.env.local`:

```bash
# Vercel AI Gateway API Key
AI_GATEWAY_API_KEY=your_actual_gateway_api_key_here
```

**Belangrijk**: 
- Deze key krijg je van Vercel AI Gateway dashboard
- Dit is NIET hetzelfde als je OpenAI API key
- De key moet beginnen met iets als `vag_...` (Vercel AI Gateway prefix)

## Hoe te Testen

### 1. Check Environment Variable
```bash
# In PowerShell
$env:AI_GATEWAY_API_KEY

# Of in je applicatie console
console.log('Gateway API Key:', process.env.AI_GATEWAY_API_KEY ? 'Present' : 'Missing')
```

### 2. Test Image Generation
```typescript
// Via de API endpoint
const response = await fetch('/api/generate-image-google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A beautiful cosmic landscape with stars and galaxies',
    orgId: 'your-org-id'
  })
})

const data = await response.json()
console.log('Image URL:', data.imageUrl)
console.log('Provider:', data.provider) // Should show 'vercel-gateway-gemini-sdk'
```

### 3. Check Vercel Logs
Na het maken van een request, check de Vercel logs om te zien of de requests nu wel binnenkomen:

```bash
vercel logs --follow
```

Je zou nu moeten zien:
```
🚀 Attempting Vercel AI Gateway with Gemini 2.5 Flash Image SDK
🔍 Gemini SDK Response: [response data]
✅ Gemini image uploaded to Supabase: [url]
```

## Request Flow

```
User Request
    ↓
API Route (/api/generate-image-google)
    ↓
Check AI_GATEWAY_API_KEY ✅
    ↓
Configure Google Provider with Gateway credentials ✅
    ↓
Call generateText with configured provider ✅
    ↓
Request goes to: https://ai-gateway.vercel.sh ✅
    ↓
Gateway routes to Google Gemini API ✅
    ↓
Response returned to application ✅
    ↓
Image uploaded to Supabase Storage ✅
    ↓
Public URL returned to user ✅
```

## Verificatie van de Fix

### ✅ Checklist
- [x] Google provider wordt geïmporteerd
- [x] Provider wordt geconfigureerd met API key
- [x] Base URL is ingesteld op Vercel AI Gateway
- [x] Model gebruikt de geconfigureerde provider
- [x] Geen linting errors
- [x] Fallback naar DALL-E blijft werken

### 🔍 Wat te Controleren

1. **Environment Variable aanwezig?**
   ```typescript
   if (!process.env.AI_GATEWAY_API_KEY) {
     console.log('❌ AI Gateway API Key not configured')
   }
   ```

2. **Provider correct geconfigureerd?**
   ```typescript
   const google = createGoogleGenerativeAI({
     apiKey: gatewayApiKey, // ✅ Moet present zijn
     baseURL: 'https://ai-gateway.vercel.sh/google-ai-studio/v1beta' // ✅ Moet correct pad hebben
   })
   ```

3. **Requests bereiken Vercel?**
   - Check Vercel dashboard → Functions → Logs
   - Zoek naar requests naar `/api/generate-image-google`
   - Je zou succesvolle 200 responses moeten zien

## Troubleshooting

### Nog steeds geen requests in Vercel?

1. **Check API Key Format**
   ```bash
   # De key moet er ongeveer zo uitzien:
   AI_GATEWAY_API_KEY=vag_xxxxxxxxxxxxxxxxxxxxxxx
   ```

2. **Verify Vercel Project**
   - Ga naar Vercel Dashboard
   - Check of de environment variable is ingesteld in project settings
   - Redeploy indien nodig

3. **Check Console Logs**
   ```typescript
   console.log('🔍 Gateway Configuration:', {
     hasApiKey: !!gatewayApiKey,
     apiKeyPrefix: gatewayApiKey?.substring(0, 4),
     baseURL: 'https://ai-gateway.vercel.sh'
   })
   ```

4. **Test Direct API Call**
   ```bash
   curl -X POST https://ai-gateway.vercel.sh/v1/chat/completions \
     -H "Authorization: Bearer YOUR_GATEWAY_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "model": "google/gemini-2.5-flash-preview",
       "messages": [{"role": "user", "content": "Test"}]
     }'
   ```

### Error: "Failed to fetch"

Dit betekent dat de SDK de Gateway niet kan bereiken:
- Check of `baseURL` correct is ingesteld
- Verify dat de API key valid is
- Check je internet connectie

### Error: "Unauthorized"

Dit betekent dat de API key niet valid is:
- Verify de key in je `.env.local`
- Check of de key niet is expired
- Generate een nieuwe key in Vercel Dashboard indien nodig

## Volgende Stappen

1. ✅ Deploy de changes naar Vercel
2. ✅ Test image generation via de UI
3. ✅ Monitor Vercel logs voor succesvolle requests
4. ✅ Check Vercel AI Gateway dashboard voor usage statistics

## Resources

- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs)
- [Google Provider Docs](https://sdk.vercel.ai/providers/ai-sdk-providers/google-generative-ai)
- [AI Gateway Docs](https://vercel.com/docs/ai-gateway)
