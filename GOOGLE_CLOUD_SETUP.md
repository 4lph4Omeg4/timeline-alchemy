# Google Cloud Setup voor Imagen API
# Volg deze stappen om Google Imagen te configureren

## 1. Google Cloud Project Setup

### Stap 1: Project aanmaken
1. Ga naar [Google Cloud Console](https://console.cloud.google.com/)
2. Maak een nieuw project aan of selecteer een bestaand project
3. Noteer je Project ID

### Stap 2: Vertex AI API inschakelen
1. Ga naar "APIs & Services" > "Library"
2. Zoek naar "Vertex AI API"
3. Klik op "Enable"

### Stap 3: Service Account aanmaken
1. Ga naar "IAM & Admin" > "Service Accounts"
2. Klik op "Create Service Account"
3. Geef een naam: `imagen-api-service`
4. Beschrijving: `Service account for Imagen API access`
5. Klik "Create and Continue"

### Stap 4: Permissions toewijzen
1. Selecteer de volgende rollen:
   - `Vertex AI User`
   - `AI Platform Developer`
2. Klik "Continue" en dan "Done"

### Stap 5: Service Account Key genereren
1. Klik op je service account
2. Ga naar "Keys" tab
3. Klik "Add Key" > "Create new key"
4. Selecteer "JSON"
5. Download het JSON bestand

## 2. Environment Variables

Voeg deze variabelen toe aan je `.env.local`:

```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
```

**Belangrijk:** 
- Vervang `your-project-id-here` met je echte Project ID
- Vervang `path/to/your/service-account-key.json` met het pad naar je gedownloade JSON bestand

**Alternatief (JSON in environment variable):**
```bash
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id-here
GOOGLE_APPLICATION_CREDENTIALS_JSON={"type":"service_account","project_id":"your-project-id",...}
```

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
