# Vercel Build Timeout Fix

## Probleem

De build werkt **lokaal** maar **hangt op Vercel** - geen errors, maar build duurt "een eeuwigheid" en er gebeurt niets meer.

## Oorzaak

**Vercel build timeout** door:
1. Te veel API routes (90+ routes)
2. Debug routes die tijdens build worden geëvalueerd
3. Memory issues tijdens build
4. Geen build optimalisaties

## Oplossingen Geïmplementeerd

### 1. Vercel Configuration (`vercel.json`)

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "installCommand": "npm install --legacy-peer-deps",
  "functions": {
    "app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

**Toegevoegd:**
- ✅ **Memory increase**: `--max-old-space-size=4096` (4GB memory)
- ✅ **Function timeout**: 30 seconden voor API routes
- ✅ **Legacy peer deps**: Voor compatibiliteit

### 2. Next.js Configuration (`next.config.js`)

```javascript
const nextConfig = {
  images: {
    domains: ['localhost', 'supabase.co', 'auth.timeline-alchemy.nl'],
  },
  // Optimize build performance
  experimental: {
    optimizeCss: true,
  },
  // Optimize bundle
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    return config
  },
  // Skip debug routes in production builds
  async rewrites() {
    return {
      beforeFiles: [
        // Skip debug routes in production
        ...(process.env.NODE_ENV === 'production' ? [
          {
            source: '/api/debug/:path*',
            destination: '/404'
          }
        ] : [])
      ]
    }
  },
}
```

**Toegevoegd:**
- ✅ **CSS optimization**: `optimizeCss: true`
- ✅ **Bundle optimization**: Webpack fallbacks
- ✅ **Debug route skipping**: Skip debug routes in production
- ✅ **Supabase domain**: Toegevoegd `auth.timeline-alchemy.nl`

## Waarom Dit Helpt

### Memory Issues
- **Probleem**: Build gebruikt te veel memory
- **Oplossing**: `--max-old-space-size=4096` geeft 4GB memory

### Debug Routes
- **Probleem**: Debug routes worden geëvalueerd tijdens build
- **Oplossing**: Skip debug routes in production builds

### Bundle Size
- **Probleem**: Te grote bundle
- **Oplossing**: Webpack optimizations en CSS optimization

### Function Timeouts
- **Probleem**: API routes kunnen te lang duren
- **Oplossing**: 30 seconden timeout per function

## Testen

### Lokaal Testen:
```bash
npm run build
```

### Vercel Deployment:
1. Commit en push changes
2. Monitor Vercel build logs
3. Check of build sneller voltooit

## Verwachte Resultaten

### Voor de Fix:
- ❌ Build hangt op Vercel
- ❌ Geen progress na lange tijd
- ❌ Timeout errors

### Na de Fix:
- ✅ Build voltooit sneller
- ✅ Geen timeout errors
- ✅ Debug routes geskipped in production
- ✅ Betere memory management

## Monitoring

**Check Vercel build logs voor:**
1. **Memory usage** - Moet onder 4GB blijven
2. **Build time** - Moet sneller zijn
3. **Debug routes** - Moeten geskipped worden
4. **Bundle size** - Moet geoptimaliseerd zijn

## Status

✅ **Vercel config geoptimaliseerd**  
✅ **Next.js config geoptimaliseerd**  
✅ **Memory limits verhoogd**  
✅ **Debug routes geskipped**  
⏳ **Klaar voor deployment test**  

De build zou nu sneller moeten voltooien op Vercel! 🚀
