# SAMI Elite 3.0.0 - Deployment Guide

## Quick Status

**Current Build:** 3.0.0
**Branch:** `sami-elite/3.0.0`
**Status:** Ready for Deployment ✅

---

## Critical: Why Services Are Failing

The app requires a **backend API** at `https://sami.site` to function. Without it, users see:
- ❌ "Load failed" on CAD/maps/services
- ❌ "Find what3words address" button doesn't work
- ❌ "Calculate truck route" fails
- ❌ Ask SAMI (AI) doesn't work

---

## Deployment Steps

### 1️⃣ **Deploy Backend to Vercel**

```bash
# Option A: Use Vercel CLI (Recommended)
npm install -g vercel

# Log in to your Vercel account
vercel login

# Deploy from project root
vercel --prod
```

**OR**

```bash
# Option B: Use web dashboard
# Go to https://vercel.com
# Connect GitHub repo
# Select this project
# Click "Deploy"
```

### 2️⃣ **Configure Domain**

The app expects API at `https://sami.site`. You need to:

1. **Own the domain** `sami.site` or update `network.mjs` to your domain
2. **Point DNS** to Vercel:
   - Add CNAME record: `sami.site → cname.vercel.com`
   - OR update DNS provider per Vercel instructions

3. **Verify domain** in Vercel dashboard

**If using different domain:**
```
# Edit this line in src/core/network.mjs
return "https://your-domain.com"
```

### 3️⃣ **Set Environment Variables on Vercel**

Go to **Vercel Dashboard → Project Settings → Environment Variables**

Add these variables:

#### **Required:**
```
WHAT3WORDS_API_KEY=<your-api-key>
```
- Get key: https://developer.what3words.com/
- Enables: Address lookup, ///words features

#### **Optional but Recommended:**

```
AI_GATEWAY_API_KEY=<your-api-key>
```
- Get key: https://www.anthropic.com
- Enables: "Ask SAMI" (AI planning assistant)

```
VALHALLA_URL=<your-url>
```
- Self-host Valhalla or use public instance
- Default: Public Valhalla (may be slower)
- Enables: Truck route calculation

```
BLOB_READ_WRITE_TOKEN=<token>
BLOB_STORE_ID=<id>
```
- Enables: Cloud project sync
- Get from: Vercel Blob storage

#### **Optional:**
```
OVERPASS_URL=https://your-overpass-instance/api/interpreter
PHOTON_URL=https://your-photon-instance/api/
```
- CAD/services use public instances by default
- Self-host only if public APIs are rate-limited

### 4️⃣ **Redeploy with Environment Variables**

After setting environment variables:

```bash
# Trigger redeploy
vercel --prod

# OR in web dashboard: Click "Redeploy"
```

---

## Testing the Deployment

### **1. Test API Health Endpoint**

```bash
curl https://sami.site/api/health
```

**Expected Response:**
```json
{
  "version": "3.0.0",
  "cad": "local-vector",
  "what3words": true,
  "ai": true,
  "cloud": true,
  "providers": {
    "cad": "OpenStreetMap / Overpass",
    "routing": "Configured Valhalla"
  }
}
```

### **2. Test in Web Browser**

Go to `https://sami.site` and:
- ✅ Draw a site boundary
- ✅ Click "Services & layers" → "Load records"
- ✅ Place an access point → "Find what3words address"
- ✅ Try "Ask SAMI" if AI is configured

### **3. Test on iOS TestFlight**

After web tests pass:
```bash
npm run ios:sync
# This builds and syncs with Xcode
# Then use Xcode to push to TestFlight
```

---

## Service Configuration Details

### **What3Words** (Priority: HIGH)
- **API Key:** Required for address lookup
- **Sign up:** https://developer.what3words.com/
- **Free tier:** 25,000 req/month (sufficient for most projects)
- **Cost after:** $0.05-0.50 per request (overages)

### **Valhalla Routing** (Priority: MEDIUM)
- **Default:** Public service at `https://valhalla1.openstreetmap.de/route`
- **Self-hosted:** Recommended if heavy use
- **Docker image:** Available for self-hosting

### **CAD/Map Data** (Priority: HIGH)
- **Source:** OpenStreetMap + Overpass API
- **Public API:** Works but may hit rate limits
- **Self-hosted Overpass:** More reliable for production

### **AI Assistant** (Priority: LOW)
- **Service:** Anthropic Claude API
- **API Key:** Required to enable "Ask SAMI"
- **Model:** Configurable in `server/assistant.mjs`

---

## Troubleshooting

### Services still showing "Load failed"

**Check:**
1. API health: `curl https://sami.site/api/health`
2. Backend logs in Vercel dashboard
3. Network connectivity from Vercel region to service URLs
4. Rate limits on public APIs

**Fix:**
- Self-host Overpass API if rate-limited
- Configure `OVERPASS_URL` env var

### What3Words address lookup broken

**Check:**
1. `WHAT3WORDS_API_KEY` is set in Vercel
2. API key is valid and not rate-limited
3. Coordinates are within UK (current scope)

**Fix:**
- Verify API key in developer dashboard
- Check usage/limits at https://developer.what3words.com/

### Route calculation failed

**Check:**
1. Access point is placed on map
2. Departure location can be found (postcode/coords valid)
3. Valhalla service is accessible

**Fix:**
- Use valid UK postcode or lat/lon
- Configure Valhalla self-hosting if needed
- Check `VALHALLA_URL` env var

---

## Production Checklist

Before releasing to TestFlight:

- [ ] Environment variables set on Vercel
- [ ] Domain pointing to Vercel
- [ ] API health endpoint responds
- [ ] CAD/services load without errors
- [ ] What3Words address lookup works
- [ ] Route calculation works
- [ ] "Ask SAMI" works (if enabled)
- [ ] iOS app rebuilt and synced
- [ ] TestFlight build successful
- [ ] Test on actual device

---

## File Structure

```
sami-elite/
├── api/
│   └── [action].js          ← Vercel serverless functions
├── server/
│   ├── handlers.mjs         ← API endpoint handlers
│   ├── upstream.mjs         ← Service integrations
│   ├── assistant.mjs        ← AI service config
│   └── cloud.mjs            ← Cloud storage config
├── src/
│   ├── core/network.mjs     ← API base URL config
│   └── App.tsx              ← Main app
├── dist/                    ← Built app (created by npm run build)
├── vercel.json              ← Vercel config
├── package.json
└── capacitor.config.ts      ← iOS build config
```

---

## Important Notes

1. **API Base URL:** The iOS app hardcodes `https://sami.site` for native platform. Update if using different domain.

2. **CORS Headers:** Already configured in `vercel.json`

3. **Rate Limiting:** Public Overpass API limited to 1 req/sec. Self-host for production use.

4. **Data Privacy:** All project data stored locally on device. Cloud sync is optional.

---

## Support

For issues:
1. Check Vercel logs: Dashboard → Deployments → Logs
2. Test API endpoints with curl
3. Verify environment variables are set
4. Check service status pages:
   - Overpass: https://overpass-api.de/status.php
   - What3Words: https://status.what3words.com/

---

**Last Updated:** 2026-11-25
**Version:** 3.0.0
