# Quick Setup Guide - OAuth Credentials

## Google OAuth Setup (5 min)

1. **Go to**: https://console.cloud.google.com/
2. **Create project** or select existing
3. **APIs & Services** → **Credentials**
4. **Create Credentials** → **OAuth client ID**
5. **Application type**: Web application
6. **Authorized redirect URIs**:
   ```
   https://acceptable-exploration-production.up.railway.app/api/auth/google/callback
   http://localhost:8000/api/auth/google/callback
   ```
7. **Copy**: Client ID and Client Secret

---

## Microsoft OAuth Setup (5 min)

1. **Go to**: https://portal.azure.com/
2. **App registrations** → **New registration**
3. **Name**: M-Dental
4. **Supported types**: Accounts in any organizational directory and personal Microsoft accounts
5. **Redirect URI** (Web):
   ```
   https://acceptable-exploration-production.up.railway.app/api/auth/microsoft/callback
   http://localhost:8000/api/auth/microsoft/callback
   ```
6. **Register** → Copy **Application (client) ID**
7. **Certificates & secrets** → **New client secret** → Copy **Value**

---

## Railway Env Vars (Add these)

```env
GOOGLE_CLIENT_ID=<paste-here>
GOOGLE_CLIENT_SECRET=<paste-here>
MICROSOFT_CLIENT_ID=<paste-here>
MICROSOFT_CLIENT_SECRET=<paste-here>
FRONTEND_URL=https://m-finance-pacient-finally-main-3kro.vercel.app
```

**Keep existing**:
- MONGO_URL
- DB_NAME
- ENVIRONMENT=production
- CORS_ORIGINS

---

## Deploy & Test

1. **Push to Railway** (or click "Deploy latest")
2. **Redeploy Vercel frontend**
3. **Test**: Open your Vercel URL → Click "Kyçuni me Google"
4. **Verify**: Should redirect to Google → authorize → redirect back to `/admin` or `/staff`

---

## Done! ✅

Your app now uses direct OAuth without Emergent Auth dependency.
