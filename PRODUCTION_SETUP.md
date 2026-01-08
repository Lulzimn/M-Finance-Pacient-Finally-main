# 🚀 Setup i Prodhimit - Hapa Konkret

## ✅ Çfarë Duhet të Bësh Tani

### 1. **Backend në Railway** (5 minuta)

#### Shko në Railway Dashboard:
1. Hap projektin tënd
2. Kliko në backend service → **Variables**
3. Shto/ndrysho këto:

```bash
# URL e frontend (kopjo nga Vercel)
FRONTEND_URL=https://jot-frontend-app.vercel.app

# CORS origins (kopjo të njëjtën URL)
CORS_ORIGINS=https://jot-frontend-app.vercel.app

# Të gjitha të tjerat duhet të jenë si më poshtë (kopjo nga .env local):
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/?appName=Cluster0
DB_NAME=m_dental
SENDGRID_API_KEY=your-sendgrid-api-key-here
SENDER_EMAIL=staffmdental@gmail.com
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
SESSION_SECRET=production-secret-change-me-12345
LOCKDOWN_MODE=false
ENVIRONMENT=production
```

4. Prit që backend të redeploy automatikisht
5. **Kopjo URL e backend** (diçka si: `https://m-dental-backend-xyz.railway.app`)

---

### 2. **Frontend në Vercel** (3 minuta)

#### Shko në Vercel Dashboard:
1. Kliko projektin → **Settings** → **Environment Variables**
2. Shto/ndrysho:

```bash
REACT_APP_BACKEND_URL=https://m-dental-backend-xyz.railway.app
```
*(zëvendëso me URL e vërtetë nga Railway)*

3. Kliko **Save**
4. Shko te **Deployments** → kliko **Redeploy**

---

### 3. **Google OAuth Setup** (2 minuta)

#### Shko në [Google Cloud Console](https://console.cloud.google.com):
1. Zgjedh projektin tënd
2. **APIs & Services** → **Credentials**
3. Kliko në OAuth 2.0 Client ID
4. Në **Authorized redirect URIs**, shto:

```
https://m-dental-backend-xyz.railway.app/api/auth/google/callback
```
*(zëvendëso me URL e backend nga Railway)*

5. Ruaj ndryshimet

---

## 🧪 Test Pas Setup

1. Hap frontend në Vercel: `https://jot-app.vercel.app`
2. Kliko "Vazhdo me Google"
3. Duhet të kyçesh dhe të shohësh dashboard `/admin` ose `/staff`

---

## ❌ Nëse Prapë Nuk Punon

### Kontrollo këto:

#### A) Browser Console (F12)
```javascript
// Duhet të shohësh këto request:
// GET https://jot-backend.railway.app/api/auth/google/login
// GET https://jot-backend.railway.app/api/auth/google/callback
```

#### B) Railway Logs
```bash
# Duhet të shohësh:
INFO: 127.0.0.1 - "GET /api/auth/google/login" 302
INFO: 127.0.0.1 - "GET /api/auth/google/callback" 302
```

#### C) Vercel Build Logs
```bash
# Kontrollo që REACT_APP_BACKEND_URL është vendosur:
✓ Environment variable REACT_APP_BACKEND_URL detected
```

---

## 📝 Checklist i Shpejtë

- [ ] Railway backend ka `FRONTEND_URL` dhe `CORS_ORIGINS` me URL e Vercel
- [ ] Vercel frontend ka `REACT_APP_BACKEND_URL` me URL e Railway
- [ ] Google OAuth ka redirect URI me backend Railway URL
- [ ] Backend është redeploy pas ndryshimeve
- [ ] Frontend është redeploy pas ndryshimeve

---

## 💡 Për Test Lokal

Nëse teston në `localhost`:

**Backend `.env`:**
```bash
FRONTEND_URL="http://localhost:3000"
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000"
```

**Frontend `.env.local`:**
```bash
REACT_APP_BACKEND_URL=http://localhost:8000
```

**Google OAuth Redirect:**
```
http://localhost:8000/api/auth/google/callback
```

---

## 🆘 Ndihmë e Shpejtë

**Problem:** "Localhost login"  
**Zgjidhje:** Frontend nuk e di backend URL. Shto `REACT_APP_BACKEND_URL` në Vercel.

**Problem:** "Gmail nuk funksionon"  
**Zgjidhje:** Backend nuk e di ku të redirect. Shto `FRONTEND_URL` në Railway.

**Problem:** "Mbetet blu"  
**Zgjidhje:** CORS blocked ose Google OAuth redirect URI gabim.

---

Pas këtyre 3 hapave, sistemi duhet të punojë 100% në production! 🎉
