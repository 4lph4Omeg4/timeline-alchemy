# 🚀 Deployment Checklist - Gemini Image Generation

## Status: Ready to Deploy ✅

Alle wijzigingen zijn lokaal gemaakt en moeten nu naar Vercel worden gedeployed.

## Wat is er veranderd?

### 1. Image Generation Updates
- ✅ **app/api/generate-image/route.ts** - Verbeterde logging
- ✅ **app/api/generate-image-google/route.ts** - Vereenvoudigde Gemini implementatie  
- ✅ **lib/vercel-ai.ts** - Correcte Google API integratie
- ✅ **env.example** - Toegevoegd: `GOOGLE_GENERATIVE_AI_API_KEY`

### 2. Nieuwe Files
- ✅ **GEMINI_CORRECT_SETUP.md** - Volledige documentatie
- ✅ **test-gemini-image.mjs** - Test script
- ✅ **package.json** - Toegevoegd: `npm run test:gemini` command

### 3. Verwijderde Files
- ✅ **GEMINI_FIX.md** - Oude, incorrecte documentatie verwijderd

## Pre-Deployment Checklist

### Lokaal Testen (Optioneel maar aanbevolen)

```bash
# 1. Voeg Google API key toe aan .env.local
echo "GOOGLE_GENERATIVE_AI_API_KEY=your_key_here" >> .env.local

# 2. Test de setup
npm run test:gemini

# 3. Test de applicatie lokaal
npm run dev

# 4. Test image generation in de UI
# - Ga naar dashboard/content
# - Probeer een image te genereren
# - Check de console logs
```

## Deployment Stappen

### Stap 1: Vercel Environment Variables Instellen

**Belangrijk!** Voeg de Google API key toe aan Vercel:

1. Ga naar [Vercel Dashboard](https://vercel.com/dashboard)
2. Selecteer je project: `golden-image-creator`
3. Ga naar **Settings** → **Environment Variables**
4. Voeg toe:

   ```
   Name:  GOOGLE_GENERATIVE_AI_API_KEY
   Value: AIza...your_google_api_key_here
   
   Environments:
   ✅ Production
   ✅ Preview
   ✅ Development
   ```

5. Klik **Save**

**Waar krijg je deze key?**
- Ga naar [Google AI Studio](https://aistudio.google.com/)
- Klik op **"Get API Key"**
- Maak een nieuwe API key aan
- Kopieer de key (begint met `AIza...`)

### Stap 2: Code Committen naar Git

```bash
# Check wat er gewijzigd is
git status

# Stage alle wijzigingen
git add .

# Commit met duidelijke message
git commit -m "feat: Simplified Gemini image generation using official Vercel AI SDK approach

- Vereenvoudigde Google Gemini integratie volgens officiële Vercel docs
- Gebruikt GOOGLE_GENERATIVE_AI_API_KEY in plaats van AI_GATEWAY_API_KEY
- Directe model string zonder custom provider configuratie
- Toegevoegd: test script voor lokaal testen
- Verbeterde documentatie in GEMINI_CORRECT_SETUP.md"

# Push naar main branch (triggers automatisch Vercel deployment)
git push origin main
```

### Stap 3: Vercel Deployment Monitoren

1. **Check Vercel Dashboard**
   - De deployment start automatisch na `git push`
   - Monitor de build logs in real-time

2. **Controleer Build Logs**
   ```
   ✅ Building...
   ✅ No TypeScript errors found
   ✅ Compiling...
   ✅ Creating optimized production build...
   ✅ Deployment completed
   ```

3. **Wacht op Deployment Success**
   - Deployment duurt meestal 2-5 minuten
   - Je krijgt een notificatie als het klaar is

### Stap 4: Post-Deployment Verificatie

#### A. Check Environment Variables
1. Ga naar Vercel Dashboard → je project
2. Settings → Environment Variables
3. Verify `GOOGLE_GENERATIVE_AI_API_KEY` is zichtbaar
4. Check alle environments (Production, Preview, Development)

#### B. Test de API Endpoints

**Test 1: Health Check**
```bash
curl https://www.timeline-alchemy.nl/api/generate-image-google \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'

# Verwachte response: 200 OK of 400 (als orgId ontbreekt)
# NOT: 405 Method Not Allowed
```

**Test 2: Via de UI**
1. Ga naar https://www.timeline-alchemy.nl
2. Log in met je account
3. Ga naar Dashboard → Content
4. Genereer een nieuwe post met image
5. Check browser console voor logs:
   ```
   🚀 Using Google Gemini for image generation
   ✅ Gemini image uploaded to Supabase: [url]
   ```

**Test 3: Check Vercel Logs**
1. Vercel Dashboard → je project
2. **Deployments** → Latest deployment
3. Klik **View Function Logs**
4. Filter: `/api/generate-image`
5. Check voor:
   ```
   🚀 Using Google Gemini for image generation
   🔍 Gemini Response: { files: [...] }
   ✅ Gemini image uploaded to Supabase
   ```

### Stap 5: Troubleshooting na Deployment

#### Issue: Nog steeds 405 Error

**Mogelijke oorzaken:**
1. Deployment is nog niet live (check Vercel dashboard)
2. Browser cache (hard refresh met Ctrl+Shift+R)
3. CDN cache bij Vercel (wacht 1-2 minuten)

**Oplossing:**
```bash
# Force een nieuwe deployment
git commit --allow-empty -m "chore: Force redeploy"
git push origin main
```

#### Issue: API Key not found

**Check Vercel Logs:**
```
🔄 Google API Key not configured, falling back to DALL-E
```

**Oplossing:**
1. Verify environment variable in Vercel settings
2. Spelling check: `GOOGLE_GENERATIVE_AI_API_KEY`
3. Redeploy na het toevoegen van de variable

#### Issue: Google API Error

**Check Vercel Logs:**
```
❌ Gemini SDK image generation failed: [error]
```

**Oplossingen:**
1. Verify API key is correct (kopieer opnieuw van Google AI Studio)
2. Check API is enabled in Google Cloud Console
3. Verify je hebt nog quota (1500 free requests/day)

## Success Criteria ✅

Je deployment is succesvol als:

- ✅ Build succeeds zonder errors
- ✅ Environment variable is ingesteld in Vercel
- ✅ `/api/generate-image` geeft 200 of 400 (niet 405)
- ✅ Image generation werkt in de UI
- ✅ Vercel logs tonen "Using Google Gemini"
- ✅ Images worden gegenereerd en opgeslagen in Supabase

## Rollback Plan (als er iets misgaat)

Als de nieuwe deployment problemen geeft:

### Optie 1: Vercel Rollback
1. Ga naar Vercel Dashboard → Deployments
2. Vind de vorige werkende deployment
3. Klik **"..."** → **"Promote to Production"**

### Optie 2: Git Revert
```bash
# Revert de laatste commit
git revert HEAD
git push origin main
```

### Optie 3: Temporary Fallback
De code heeft automatisch fallback naar DALL-E. Als Google API faalt:
1. Verwijder `GOOGLE_GENERATIVE_AI_API_KEY` uit Vercel
2. Redeploy
3. Systeem gebruikt automatisch DALL-E

## Post-Deployment Monitoring

### Eerste 24 uur na deployment:

1. **Check Usage** (Google AI Studio)
   - Monitor API calls
   - Check voor errors
   - Verify costs blijven binnen free tier

2. **Check Vercel Logs** (regelmatig)
   - Filter op `/api/generate-image`
   - Check voor error patterns
   - Monitor response times

3. **User Feedback**
   - Test met echte content
   - Check image quality
   - Verify watermarks werken correct

## Next Steps na Succesvolle Deployment

1. ✅ Update je documentatie met production URLs
2. ✅ Monitor costs in Google AI Studio
3. ✅ Consider rate limiting voor API endpoints
4. ✅ Setup alerts voor API failures
5. ✅ Document any issues voor het team

## Contact & Support

Als je problemen hebt na deployment:

1. **Check deze checklist opnieuw**
2. **Check GEMINI_CORRECT_SETUP.md** voor troubleshooting
3. **Check Vercel logs** voor specifieke errors
4. **Test met test-gemini-image.mjs lokaal** om API key te verifiëren

## Summary

```
Current Status: ✅ Code is klaar
Next Action:    🚀 Deploy naar Vercel

Steps:
1. Add GOOGLE_GENERATIVE_AI_API_KEY to Vercel
2. Commit and push to GitHub
3. Wait for automatic deployment
4. Verify environment variable
5. Test image generation
6. Monitor logs for 24 hours

Expected Result: Image generation werkt met Google Gemini
Fallback:        Automatic fallback to DALL-E if Google fails
```

---

**Ready to deploy? Follow Step 1-5 above!** 🚀
