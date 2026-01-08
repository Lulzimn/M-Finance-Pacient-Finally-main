# Railway Backend Deployment Guide

## Quick Setup (5 minutes)

### 1. **Create Railway Account & Project**
- Go to [railway.app](https://railway.app)
- Sign up (GitHub, Google, or email)
- Create a new project

### 2. **Connect GitHub Repository**
- Click "Connect Repo" in Railway dashboard
- Select your GitHub account & repo
- Authorize Railway to access your repositories

### 3. **Add Service: Backend**
- Click "New" → "GitHub Repo"
- Select your repo
- Railway will auto-detect Procfile and deploy

### 4. **Set Environment Variables**
In Railway Dashboard → Project → Variables:

```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/m_dental?retryWrites=true&w=majority
DB_NAME=m_dental
ENVIRONMENT=production
SENDGRID_API_KEY=your-sendgrid-api-key
SENDER_EMAIL=staffmdental@gmail.com
CORS_ORIGINS=https://your-vercel-frontend-url.vercel.app
LOCKDOWN_MODE=false
```

**Note:** Replace with your actual values:
- `MONGO_URL`: Get from MongoDB Atlas
- `SENDGRID_API_KEY`: Get from SendGrid
- `CORS_ORIGINS`: Your Vercel frontend URL (from dashboard)

### 5. **Get Backend URL**
After deployment:
- Railway Dashboard → Backend Service → Settings
- Copy the "Public URL" (looks like `https://your-service-xyz.railway.app`)

### 6. **Update Frontend on Vercel**
- Go to Vercel Dashboard → Your Project → Settings → Environment Variables
- Add/Update:
  - Name: `REACT_APP_BACKEND_URL`
  - Value: `https://your-service-xyz.railway.app` (from step 5)
- Click "Save"
- Vercel will auto-redeploy

---

## Environment Variables Explained

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | ✅ Yes | MongoDB Atlas connection string |
| `DB_NAME` | ✅ Yes | Database name (usually `m_dental`) |
| `ENVIRONMENT` | ❌ Optional | Set to `production` for production mode |
| `SENDGRID_API_KEY` | ⚠️ Recommended | For sending appointment emails |
| `SENDER_EMAIL` | ❌ Optional | Email to send from (default: staffmdental@gmail.com) |
| `CORS_ORIGINS` | ✅ Yes | Frontend URL (for CORS) |
| `LOCKDOWN_MODE` | ❌ Optional | Set to `true` to disable API endpoints during maintenance |

---

## Troubleshooting

### ❌ "Cannot find module" or "ModuleNotFoundError"
- Railway dependencies not installing properly
- **Fix:** Make sure `requirements.txt` is in `/backend` folder and all dependencies are listed

### ❌ Backend returns 500 errors
- Missing environment variables
- **Fix:** Check Railway Logs → click backend service → scroll to "Build Logs" section

### ❌ Frontend still shows blue screen
- `REACT_APP_BACKEND_URL` not set on Vercel
- **Fix:** Re-check step 6 above and re-deploy Vercel

### ✅ View Deployment Logs
- Railway Dashboard → Backend Service → Logs tab
- Check for errors and startup status

---

## MongoDB Atlas Setup (if needed)

1. Go to [mongodb.com/cloud](https://mongodb.com/cloud)
2. Create account & free cluster
3. Create database user with strong password
4. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/m_dental`
5. Add to Railway env vars as `MONGO_URL`

---

## Cost & Limitations

- **Railway:** Free tier includes $5/month credit (usually enough for small apps)
- **MongoDB Atlas:** Free tier 512MB storage (good for testing)
- **SendGrid:** Free tier 100 emails/day

---

## Deploy Backend Now

```bash
git push origin main
```

Railway will automatically deploy when you push to main branch.

