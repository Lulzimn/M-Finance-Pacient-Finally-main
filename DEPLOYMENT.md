# Deployment Guide

## Frontend (Vercel)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
cd frontend
vercel --prod
```

### 3. Set Environment Variables in Vercel Dashboard
- Go to: Project Settings → Environment Variables
- Add: `REACT_APP_BACKEND_URL` = `https://your-backend-domain.com`

## Backend (Railway/Render)

### Option A: Railway (Recommended)

1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Create new project: `railway init`
4. Deploy:
```bash
cd backend
railway up
```

5. Set environment variables:
```bash
railway variables set MONGO_URL=your_mongodb_url
railway variables set DB_NAME=your_db_name
railway variables set SENDGRID_API_KEY=your_sendgrid_key
railway variables set SENDER_EMAIL=staffmdental@gmail.com
railway variables set CORS_ORIGINS=https://your-vercel-app.vercel.app,http://localhost:3000
```

### Option B: Render

1. Create new Web Service
2. Connect your GitHub repo
3. Set:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port 8000`
4. Add environment variables in dashboard

## Post-Deployment

1. Update frontend `.env.production` with backend URL
2. Redeploy frontend: `vercel --prod`
3. Test login at: `https://your-app.vercel.app`

## Important Notes

- DEV LOGIN only shows in `NODE_ENV=development`
- In production, only Google and Microsoft OAuth buttons appear
- Cookies need `secure=True` in production backend
- CORS_ORIGINS must include your Vercel domain
