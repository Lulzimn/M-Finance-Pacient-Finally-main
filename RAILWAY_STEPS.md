# Railway Deployment - Step by Step (me foto)

## **Step 1: Create Railway Account**
1. Go to **https://railway.app**
2. Click **"Sign Up"** (top right)
3. Choose **GitHub** (fastest way)
4. Click **"Authorize railway"** when asked
5. ✅ Account created

---

## **Step 2: Create New Project**
1. Go to **https://railway.app/dashboard**
2. Click **"Create New Project"** (button looks like **+**)
3. Choose **"Deploy from GitHub"**
4. Select your GitHub account
5. Search for **"M-Finance-Pacient-Finally-main"**
6. Click on it to select
7. ✅ Repo connected

---

## **Step 3: Choose Backend Folder**
1. Railway will ask: **"Which folder?"**
2. Look for dropdown or select **backend/** folder
3. Click **"Deploy"**
4. ✅ Deployment started (you'll see build logs)

---

## **Step 4: Wait for Deployment**
- You'll see yellow/blue **"Building"** status
- After 2-5 minutes, it will turn **green "Success"**
- Your backend URL will appear (like: `https://xxxxx-production.up.railway.app`)

---

## **Step 5: Set Environment Variables**
1. In Railway Dashboard, click your **Backend service**
2. Click **"Variables"** tab
3. Click **"Add Variable"** button
4. Add these one by one:

```
MONGO_URL = mongodb+srv://username:password@cluster.mongodb.net/m_dental
DB_NAME = m_dental
ENVIRONMENT = production
CORS_ORIGINS = https://your-vercel-frontend.vercel.app
SENDGRID_API_KEY = your-sendgrid-key (optional)
SENDER_EMAIL = staffmdental@gmail.com
```

5. Click **"Save"** after each one
6. ✅ App will redeploy automatically

---

## **Step 6: Get Backend URL**
1. Click your **Backend service**
2. Click **"Settings"** tab
3. Look for **"Public URL"** or **"Domain"** section
4. Copy the URL (looks like: `https://xxxxx-production.up.railway.app`)
5. ✅ This is your backend URL

---

## **Step 7: Update Vercel Frontend**
1. Go to **https://vercel.com/dashboard**
2. Click your project
3. Click **"Settings"** (top)
4. Click **"Environment Variables"** (left menu)
5. Add/Update:
   - **Name:** `REACT_APP_BACKEND_URL`
   - **Value:** `https://xxxxx-production.up.railway.app` (from Step 6)
6. Click **"Save"**
7. ✅ Vercel will auto-redeploy

---

## **Problem: "Can't find MongoDB URL"**
If you don't have MongoDB:
1. Go to **https://mongodb.com/cloud**
2. Sign up (free tier)
3. Create cluster → Create database user
4. Get connection string
5. Add to Railway env vars

---

## **Check if Working**
- Open your Vercel URL
- Should NOT be blue screen anymore
- Should see **Login page** ✅

---

## **Common Mistakes**
❌ Forgot to set `MONGO_URL` → Add it in Railway variables
❌ `CORS_ORIGINS` is wrong → Use exact Vercel URL (with https://)
❌ Didn't update Vercel env var → Update `REACT_APP_BACKEND_URL`
❌ Port is wrong → Railway auto-detects from Procfile ✅ (already fixed)

