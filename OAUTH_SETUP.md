# OAuth Setup Guide

## Overview
The application now uses direct Google and Microsoft OAuth instead of Emergent Auth.

## Required Environment Variables

### Backend (Railway)
Add these to your Railway service environment variables:

```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
FRONTEND_URL=https://m-finance-pacient-finally-main-3kro.vercel.app
```

**Keep existing variables:**
- MONGO_URL
- DB_NAME
- ENVIRONMENT=production
- CORS_ORIGINS (include Vercel domains)

### Frontend (Vercel)
No additional environment variables needed (REACT_APP_BACKEND_URL should already be set).

---

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Application type: **Web application**
6. Add authorized redirect URIs:
   ```
   https://acceptable-exploration-production.up.railway.app/api/auth/google/callback
   http://localhost:8000/api/auth/google/callback
   ```
7. Copy **Client ID** and **Client Secret** → add to Railway as `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`

---

## Microsoft OAuth Setup

1. Go to [Azure Portal](https://portal.azure.com/)
2. Navigate to **App registrations** → **New registration**
3. Name: M-Dental App
4. Supported account types: **Accounts in any organizational directory and personal Microsoft accounts**
5. Redirect URI:
   - Platform: **Web**
   - URIs:
     ```
     https://acceptable-exploration-production.up.railway.app/api/auth/microsoft/callback
     http://localhost:8000/api/auth/microsoft/callback
     ```
6. Click **Register**
7. Copy **Application (client) ID** → add to Railway as `MICROSOFT_CLIENT_ID`
8. Go to **Certificates & secrets** → **New client secret**
9. Copy the **Value** (not secret ID) → add to Railway as `MICROSOFT_CLIENT_SECRET`
10. Go to **API permissions** → verify these are added:
    - Microsoft Graph → User.Read (Delegated)

---

## Testing Locally

### Backend .env
```env
ENVIRONMENT=development
MONGO_URL=mongodb+srv://...
DB_NAME=m_dental
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
FRONTEND_URL=http://localhost:3000
LOCKDOWN_MODE=false
```

### Start backend
```bash
cd backend
pip install -r requirements.txt
python3 -m uvicorn server:app --host 127.0.0.1 --port 8000
```

### Start frontend
```bash
cd frontend
npm start
```

---

## How It Works

1. User clicks "Kyçuni me Google" or "Kyçuni me Microsoft" on login page
2. Frontend redirects to backend OAuth endpoint: `/api/auth/google/login` or `/api/auth/microsoft/login`
3. Backend initiates OAuth flow with provider
4. User authorizes on Google/Microsoft
5. Provider redirects to callback: `/api/auth/google/callback` or `/api/auth/microsoft/callback`
6. Backend:
   - Gets user info from provider
   - Creates/updates user in database
   - Creates session and sets cookie
   - Redirects to frontend `/admin` or `/staff` based on role
7. Frontend checks authentication status and displays dashboard

---

## Troubleshooting

### "Redirect URI mismatch"
- Ensure callback URIs in Google/Microsoft console exactly match your backend URL
- Include both production (Railway) and development (localhost) URIs

### "Invalid client"
- Check CLIENT_ID and CLIENT_SECRET are correct
- Ensure no extra spaces in environment variables

### "User not redirected after login"
- Verify FRONTEND_URL is set correctly in backend
- Check browser console for CORS errors

### "Session not persisting"
- Verify cookies are being set (check browser DevTools → Application → Cookies)
- Ensure CORS_ORIGINS includes your Vercel domain
- Check SameSite cookie settings (should be "None" for production with Secure flag)

---

## Security Notes

- Never commit CLIENT_SECRET values to git
- Use different OAuth apps for development and production
- Regularly rotate client secrets
- Monitor OAuth app usage in Google/Microsoft consoles
