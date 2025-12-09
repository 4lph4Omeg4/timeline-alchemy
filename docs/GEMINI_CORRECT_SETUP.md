# ✅ Correcte Gemini Image Generation Setup

## Het Probleem (Opgelost!)

We hadden het **te complex** gemaakt door custom provider configuraties te gebruiken. De officiële Vercel AI SDK documentatie laat zien dat het **veel eenvoudiger** is!

## De Juiste Aanpak (volgens Vercel Docs)

### Wat Vercel Documentatie Laat Zien

```typescript
import { generateText } from 'ai';

const result = await generateText({
  model: 'google/gemini-2.5-flash-image-preview',  // ✅ Gewoon de model string!
  providerOptions: {
    google: { responseModalities: ['TEXT', 'IMAGE'] },
  },
  prompt: 'Generate an image: ...',
});

// Images komen in result.files
const imageFiles = result.files.filter(f => f.mediaType?.startsWith('image/'));
```

**Dat is het! Geen custom provider configuratie nodig!**

## Environment Variable Setup

### Stap 1: Voeg Google API Key toe

In je `.env.local`:

```bash
# Google Generative AI API Key (voor Gemini)
GOOGLE_GENERATIVE_AI_API_KEY=AIza...your_google_api_key_here
```

**Waar krijg je deze key?**
1. Ga naar [Google AI Studio](https://aistudio.google.com/)
2. Klik op **"Get API Key"**
3. Maak een nieuwe API key aan
4. Kopieer de key

### Stap 2: Vercel Environment Variables

Als je op Vercel deployed:
1. Ga naar je project in Vercel Dashboard
2. Settings → Environment Variables
3. Voeg toe:
   - Name: `GOOGLE_GENERATIVE_AI_API_KEY`
   - Value: `AIza...your_key`
   - Apply to: Production, Preview, Development

## Hoe het Werkt

### Flow Diagram

```
User Request
    ↓
Check GOOGLE_GENERATIVE_AI_API_KEY ✅
    ↓
generateText({
  model: 'google/gemini-2.5-flash-image-preview'
})
    ↓
Vercel AI SDK routes to Google Gemini API ✅
    ↓
Response with result.files containing images ✅
    ↓
Upload to Supabase Storage ✅
    ↓
Return public URL ✅
```

### Code Vereenvoudiging

**❌ Fout (te complex):**
```typescript
const { createGoogleGenerativeAI } = await import('@ai-sdk/google')

const google = createGoogleGenerativeAI({
  apiKey: gatewayApiKey,
  baseURL: 'https://ai-gateway.vercel.sh/google-ai-studio/v1beta'
})

const result = await generateText({
  model: google('gemini-2.5-flash-image-preview'),
  // ...
})
```

**✅ Correct (volgens Vercel docs):**
```typescript
const { generateText } = await import('ai')

const result = await generateText({
  model: 'google/gemini-2.5-flash-image-preview',
  providerOptions: {
    google: { responseModalities: ['TEXT', 'IMAGE'] },
  },
  prompt: 'Generate an image: ...',
})
```

## Aangepaste Bestanden

### 1. `app/api/generate-image-google/route.ts`
- ✅ Vereenvoudigd naar officiële Vercel AI SDK aanpak
- ✅ Gebruikt `GOOGLE_GENERATIVE_AI_API_KEY` of `GOOGLE_API_KEY`
- ✅ Directe model string: `'google/gemini-2.5-flash-image-preview'`
- ✅ Geen custom provider configuratie

### 2. `lib/vercel-ai.ts`
- ✅ Dezelfde vereenvoudiging toegepast
- ✅ Gebruikt Google API key direct via environment variable
- ✅ Fallback naar DALL-E blijft gewoon werken

### 3. `env.example`
- ✅ Toegevoegd: `GOOGLE_GENERATIVE_AI_API_KEY`
- ✅ Duidelijke documentatie over waar de key vandaan komt

## Testing

### Lokaal Testen

```bash
# In je terminal
export GOOGLE_GENERATIVE_AI_API_KEY=your_key_here

# Of in PowerShell
$env:GOOGLE_GENERATIVE_AI_API_KEY="your_key_here"

# Start dev server
npm run dev
```

### Test via API

```typescript
const response = await fetch('/api/generate-image-google', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: 'A beautiful cosmic landscape with stars',
    orgId: 'your-org-id'
  })
})

const data = await response.json()
console.log('Image URL:', data.imageUrl)
console.log('Provider:', data.provider)
```

### Verwachte Output

```
🚀 Attempting Google Gemini 2.5 Flash Image generation
🔍 Gemini Response: { files: [...], text: '...' }
🔄 Uploading Gemini image to Supabase Storage...
✅ Gemini image uploaded to Supabase: https://...
```

## Belangrijke Verschillen

### ❌ Wat we NIET meer gebruiken
- `AI_GATEWAY_API_KEY` voor Gemini (dat was verwarrend)
- `createGoogleGenerativeAI()` custom provider configuratie
- Custom `baseURL` naar AI Gateway
- Complexe provider instances

### ✅ Wat we WEL gebruiken
- `GOOGLE_GENERATIVE_AI_API_KEY` van Google AI Studio
- Standaard `generateText()` functie
- Simpele model string: `'google/gemini-2.5-flash-image-preview'`
- Standaard Vercel AI SDK routing

## Vercel AI Gateway vs Direct Google API

### Direct Google API (Wat we nu doen) ✅
```typescript
// Environment Variable
GOOGLE_GENERATIVE_AI_API_KEY=AIza...

// Code
const result = await generateText({
  model: 'google/gemini-2.5-flash-image-preview',
  // SDK gebruikt automatisch de GOOGLE_GENERATIVE_AI_API_KEY
})
```

**Voordelen:**
- ✅ Simpel en direct
- ✅ Volgt officiële Vercel documentatie
- ✅ Geen extra configuratie nodig
- ✅ Werkt out-of-the-box

### Vercel AI Gateway (Optioneel, voor text generation)
```typescript
// Voor TEXT generation kun je AI Gateway gebruiken voor extra features
// Maar voor IMAGE generation is dit niet nodig
```

## Pricing & Limits

### Google Gemini API
- **Model**: Gemini 2.5 Flash Image Preview
- **Free Tier**: 1500 requests per dag
- **Cost**: Gratis tijdens preview periode
- **Rate Limit**: 60 requests per minuut
- **Image Size**: 1024x1024

### Vercel AI SDK
- **Free**: Vercel AI SDK zelf is gratis
- **Cost**: Je betaalt alleen de Google API costs
- **No Gateway Fees**: Directe API calls hebben geen extra kosten

## Troubleshooting

### "API Key not configured"

**Probleem:**
```
🔄 Google API Key not configured, falling back to DALL-E
```

**Oplossing:**
1. Check `.env.local`:
   ```bash
   GOOGLE_GENERATIVE_AI_API_KEY=AIza...your_key
   ```
2. Restart development server
3. Check Vercel environment variables (voor production)

### "Authentication failed"

**Probleem:**
```
Error: Authentication failed
```

**Oplossing:**
1. Verify API key is correct
2. Check API is enabled in Google Cloud Console
3. Generate new API key indien nodig

### "Model not found"

**Probleem:**
```
Error: Model 'gemini-2.5-flash-image-preview' not found
```

**Oplossing:**
1. Check model name spelling
2. Verify Gemini 2.5 Flash Image is available in je regio
3. Update Vercel AI SDK: `npm update ai @ai-sdk/google`

### Geen images in response

**Probleem:**
```
⚠️ No image files found in Gemini response
```

**Oplossing:**
1. Check `providerOptions`:
   ```typescript
   providerOptions: {
     google: { responseModalities: ['TEXT', 'IMAGE'] }
   }
   ```
2. Verify prompt is image-generation appropriate
3. Check Google AI Studio for model availability

## Volgende Stappen

1. ✅ Voeg `GOOGLE_GENERATIVE_AI_API_KEY` toe aan `.env.local`
2. ✅ Test lokaal met `npm run dev`
3. ✅ Voeg environment variable toe in Vercel Dashboard
4. ✅ Deploy naar Vercel
5. ✅ Test image generation via de UI
6. ✅ Monitor costs in Google AI Studio

## Resources

- [Google AI Studio](https://aistudio.google.com/) - Get API Key
- [Vercel AI SDK Docs](https://sdk.vercel.ai/docs) - Official Documentation
- [Gemini Image Generation](https://sdk.vercel.ai/docs/ai-sdk-core/generating-images) - Image Generation Guide
- [Google Gemini Docs](https://ai.google.dev/docs) - Google's Documentation

## Conclusie

We hadden het **te complex** gemaakt! De officiële Vercel aanpak is:
1. Gebruik `GOOGLE_GENERATIVE_AI_API_KEY` environment variable
2. Gebruik simpele model string: `'google/gemini-2.5-flash-image-preview'`
3. Laat de SDK de routing afhandelen

**Geen custom providers, geen custom baseURLs, geen extra configuratie!** 🎉
