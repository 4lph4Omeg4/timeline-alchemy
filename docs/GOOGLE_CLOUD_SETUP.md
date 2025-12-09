# Google Imagen Setup via AI Studio (Eenvoudiger)
# Volg deze stappen om Google Imagen te configureren via AI Studio

## 1. Google AI Studio Setup

### Stap 1: Ga naar Google AI Studio
1. Ga naar [Google AI Studio](https://aistudio.google.com/)
2. Log in met je Google account

### Stap 2: API Key aanmaken
1. Klik op **"Get API Key"** in de linker sidebar
2. Klik **"Create API Key"**
3. Selecteer je project (of maak een nieuw project aan)
4. Kopieer je API Key

### Stap 3: Imagen API inschakelen
1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Selecteer je project
3. Ga naar **"APIs & Services"** > **"Library"**
4. Zoek naar **"Generative Language API"**
5. Klik op **"Enable"**

## 2. Environment Variables

Voeg deze variabele toe aan je `.env.local`:

```bash
# Google AI Studio API Key
GOOGLE_API_KEY=your-api-key-here
```

**Belangrijk:** 
- Vervang `your-api-key-here` met je echte API Key van Google AI Studio
- Deze API Key geeft toegang tot Imagen via de Generative Language API

## 3. Pricing & Limits

### Imagen Pricing (per 1 januari 2024):
- **Imagen 3**: $0.02 per image (1024x1024)
- **Gratis tier**: 100 images per maand
- **Sneller en goedkoper** dan DALL-E 3

### Rate Limits:
- **Default**: 60 requests per minute
- **Kun je verhogen** via Google Cloud Console

## 4. Voordelen van Google Imagen

✅ **Sneller**: Gemiddeld 2-3x sneller dan DALL-E  
✅ **Goedkoper**: $0.02 vs $0.04 per image  
✅ **Betere kwaliteit**: Vooral voor realistische afbeeldingen  
✅ **Geen rate limits**: Bij Google Pro account  
✅ **Betere prompt understanding**: Begrijpt complexere prompts  

## 5. Fallback Systeem

Het systeem gebruikt automatisch:
1. **Google Imagen** (als geconfigureerd)
2. **DALL-E 3** (als fallback)

Dit zorgt voor maximale betrouwbaarheid!

## 6. Test de Setup

Na configuratie kun je testen met:
```bash
curl -X POST http://localhost:3000/api/generate-image-google \
  -H "Content-Type: application/json" \
  -d '{"prompt": "A beautiful cosmic landscape"}'
```

## 7. Monitoring

Check je Google Cloud Console voor:
- **Usage**: Hoeveel images je hebt gegenereerd
- **Costs**: Huidige kosten
- **Errors**: Eventuele API errors

## 8. Troubleshooting

### Veelvoorkomende problemen:

**"Authentication failed"**
- Controleer je service account key
- Zorg dat Vertex AI API is ingeschakeld

**"Project not found"**
- Controleer je Project ID
- Zorg dat je project actief is

**"Permission denied"**
- Controleer je service account permissions
- Zorg dat Vertex AI User rol is toegewezen

**"Rate limit exceeded"**
- Wacht even en probeer opnieuw
- Overweeg rate limit verhoging in Google Cloud Console
