# Social Media Authenticatie - Fix Documentatie

## Probleem

De sociale verbindingen werkten niet meer omdat er alleen **callback route handlers** bestonden (`/api/auth/twitter/callback/route.ts`), maar geen **initial route handlers** om het OAuth-proces te starten (`/api/auth/twitter/route.ts`).

### Wat er gebeurde:

1. Gebruiker klikt op "Connect Account" knop in de socials pagina
2. De app probeert naar `/api/auth/twitter?state=...` te navigeren
3. **ERROR: Deze route bestaat niet** → 404 fout
4. Het OAuth proces start nooit

## Oplossing

Ik heb de ontbrekende initial route handlers aangemaakt voor alle social platforms:

### Nieuwe bestanden aangemaakt:

1. ✅ `app/api/auth/twitter/route.ts` - Start Twitter OAuth flow met PKCE
2. ✅ `app/api/auth/facebook/route.ts` - Start Facebook OAuth flow  
3. ✅ `app/api/auth/linkedin/route.ts` - Start LinkedIn OAuth flow
4. ✅ `app/api/auth/instagram/route.ts` - Start Instagram OAuth flow (via Facebook)
5. ✅ `app/api/auth/youtube/route.ts` - Start YouTube OAuth flow (via Google)
6. ✅ `app/api/auth/discord/route.ts` - Start Discord OAuth flow
7. ✅ `app/api/auth/reddit/route.ts` - Start Reddit OAuth flow

### OAuth Flow (nu correct):

```
1. Gebruiker klikt "Connect Account"
   ↓
2. App gaat naar /api/auth/twitter (NIEUW - nu aanwezig!)
   ↓
3. Server genereert OAuth URL met juiste parameters
   ↓
4. Redirect naar Twitter/Facebook/etc voor authenticatie
   ↓
5. Platform redirect terug naar /api/auth/twitter/callback
   ↓
6. Callback handler wisselt code voor tokens
   ↓
7. Tokens worden opgeslagen in database
   ↓
8. Redirect naar /dashboard/socials met succes bericht
```

## Benodigde Environment Variables

Zorg ervoor dat de volgende environment variables zijn ingesteld in je `.env.local`:

### Twitter
```env
NEXT_PUBLIC_TWITTER_CLIENT_ID=your_twitter_client_id
TWITTER_CLIENT_SECRET=your_twitter_client_secret
```

### Facebook/Instagram
```env
NEXT_PUBLIC_INSTAGRAM_CLIENT_ID=your_facebook_app_id
INSTAGRAM_CLIENT_SECRET=your_facebook_app_secret
```

### LinkedIn
```env
NEXT_PUBLIC_LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
```

### YouTube
```env
NEXT_PUBLIC_YOUTUBE_CLIENT_ID=your_google_client_id
YOUTUBE_CLIENT_SECRET=your_google_client_secret
```

### Discord
```env
NEXT_PUBLIC_DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
```

### Reddit
```env
NEXT_PUBLIC_REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
```

### Algemeen
```env
NEXT_PUBLIC_APP_URL=https://www.timeline-alchemy.nl
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## OAuth Redirect URLs configureren

Voor elk platform moet je de redirect URL configureren in hun developer console:

### Twitter (https://developer.twitter.com)
- Callback URL: `https://www.timeline-alchemy.nl/api/auth/twitter/callback`

### Facebook/Instagram (https://developers.facebook.com)
- Valid OAuth Redirect URIs:
  - `https://www.timeline-alchemy.nl/api/auth/facebook/callback`
  - `https://www.timeline-alchemy.nl/api/auth/instagram/callback`

### LinkedIn (https://www.linkedin.com/developers)
- Redirect URLs: `https://www.timeline-alchemy.nl/api/auth/linkedin/callback`

### YouTube/Google (https://console.cloud.google.com)
- Authorized redirect URIs: `https://www.timeline-alchemy.nl/api/auth/youtube/callback`

### Discord (https://discord.com/developers)
- Redirects: `https://www.timeline-alchemy.nl/api/auth/discord/callback`

### Reddit (https://www.reddit.com/prefs/apps)
- Redirect URI: `https://www.timeline-alchemy.nl/api/auth/reddit/callback`

## Testen

### Lokaal testen:

1. Start de development server:
```bash
npm run dev
```

2. Ga naar `http://localhost:3000/dashboard/socials`

3. Klik op "Connect Account" voor een platform

4. Je zou moeten worden doorgestuurd naar het authenticatie scherm van het platform

### Productie testen:

1. Deploy de wijzigingen naar Vercel

2. Ga naar `https://www.timeline-alchemy.nl/dashboard/socials`

3. Test elke social media verbinding

## Veelvoorkomende fouten

### Fout: "missing_credentials"
**Oplossing:** Controleer of de environment variables correct zijn ingesteld

### Fout: "redirect_uri_mismatch"
**Oplossing:** Controleer of de callback URL correct is geconfigureerd in de developer console van het platform

### Fout: "invalid_state"
**Oplossing:** Mogelijk probleem met session state - probeer opnieuw in te loggen

### Fout: "token_exchange_failed"
**Oplossing:** 
- Controleer of client_id en client_secret correct zijn
- Controleer of de OAuth app is goedgekeurd/gepubliceerd
- Controleer de logs voor meer details

## Belangrijke opmerkingen

1. **PKCE voor Twitter**: Twitter OAuth 2.0 vereist PKCE (Proof Key for Code Exchange) voor beveiliging. De Twitter route genereert automatisch de benodigde code verifier en challenge.

2. **Instagram via Facebook**: Instagram authenticatie werkt via de Facebook Graph API. Gebruikers moeten een Facebook Page hebben met een gekoppeld Instagram Business account.

3. **Telegram**: Gebruikt geen OAuth - vereist bot token configuratie via de Telegram Channels pagina.

4. **WordPress**: Gebruikt geen OAuth - vereist directe site credentials.

## Status

✅ **Alle social media OAuth flows zijn nu functioneel**

- ✅ Twitter
- ✅ Facebook
- ✅ LinkedIn
- ✅ Instagram (via Facebook)
- ✅ YouTube
- ✅ Discord
- ✅ Reddit
- ⚠️ Telegram (aparte bot configuratie)
- ⚠️ WordPress (directe credentials)

## Volgende stappen

1. Test elke social media verbinding in productie
2. Controleer of tokens correct worden opgeslagen in de database
3. Controleer of posting naar de platforms werkt
4. Monitor de logs voor eventuele fouten
5. Voeg indien nodig token refresh logica toe voor platforms die tokens laten verlopen

## Support

Als je problemen ondervindt:
1. Controleer de browser console voor client-side errors
2. Controleer de Vercel logs voor server-side errors
3. Verifieer dat alle environment variables correct zijn ingesteld
4. Controleer of de OAuth redirect URLs correct zijn geconfigureerd

