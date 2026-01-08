# Complete Setup Guide - From Zero to Deployed

## Part 1: Setup MongoDB (5 minutes)

### Step 1: Create MongoDB Account
1. Go to **https://mongodb.com/cloud/atlas/register**
2. Sign up with Google or email (free)
3. Choose **FREE** tier (M0 Sandbox)
4. Select **AWS** and region closest to you
5. Click **Create Cluster**

### Step 2: Create Database User
1. Click **Database Access** (left menu)
2. Click **Add New Database User**
3. Choose **Password** authentication
4. Username: `admin`
5. Password: Create a strong password (save it!)
6. Database User Privileges: **Read and write to any database**
7. Click **Add User**

### Step 3: Allow Network Access
1. Click **Network Access** (left menu)
2. Click **Add IP Address**
3. Click **Allow Access from Anywhere** (0.0.0.0/0)
4. Click **Confirm**

### Step 4: Get Connection String
1. Click **Database** (left menu)
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string (looks like):
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. **Replace** `<password>` with your actual password
6. **Add** `/m_dental` before the `?` so it looks like:
   ```
   mongodb+srv://admin:YourPassword@cluster0.xxxxx.mongodb.net/m_dental?retryWrites=true&w=majority
   ```
7. **Save this string** - you'll need it!

---

## Part 2: Deploy Backend to Railway (5 minutes)

### Step 1: Create Railway Account
1. Go to **https://railway.app**
2. Click **Login with GitHub**
3. Authorize Railway

### Step 2: Deploy from GitHub
1. Click **New Project**
2. Select **Deploy from GitHub repo**
3. Choose your repository: `M-Finance-Pacient-Finally-main`
4. Railway will auto-detect and start deploying
5. Wait 2-3 minutes for build to complete

### Step 3: Add Environment Variables
1. Click your backend service (in Railway dashboard)
2. Click **Variables** tab
3. Click **+ New Variable** and add these ONE BY ONE:

```
MONGO_URL
mongodb+srv://admin:YourPassword@cluster0.xxxxx.mongodb.net/m_dental?retryWrites=true&w=majority

DB_NAME
m_dental

ENVIRONMENT
production

CORS_ORIGINS
https://your-app-name.vercel.app

SENDGRID_API_KEY
(leave empty for now - optional for emails)

SENDER_EMAIL
staffmdental@gmail.com
```

**Important:** Replace:
- `MONGO_URL` with your actual MongoDB string from Part 1
- `CORS_ORIGINS` with your Vercel URL (get from Vercel dashboard)

4. Click **Save** after each variable
5. Railway will auto-redeploy

### Step 4: Get Backend URL
1. Click **Settings** tab
2. Scroll to **Domains** section
3. Click **Generate Domain**
4. Copy the URL (looks like: `https://m-finance-backend-production-xxxx.up.railway.app`)
5. **Save this URL!**

---

## Part 3: Update Vercel (2 minutes)

### Step 1: Add Backend URL to Vercel
1. Go to **https://vercel.com/dashboard**
2. Click your project
3. Click **Settings** (top tabs)
4. Click **Environment Variables** (left menu)
5. Add new variable:
   - **Key:** `REACT_APP_BACKEND_URL`
   - **Value:** `https://your-railway-url.up.railway.app` (from Part 2, Step 4)
   - **Environments:** Check ALL (Production, Preview, Development)
6. Click **Save**

### Step 2: Update CORS on Railway
1. Go back to **Railway dashboard**
2. Click **Variables** tab
3. Find `CORS_ORIGINS` variable
4. Click **Edit**
5. Change value to your actual Vercel URL (from Vercel dashboard, looks like `https://your-app.vercel.app`)
6. Click **Save**

### Step 3: Redeploy
1. In Vercel dashboard, click **Deployments** tab
2. Click the **3 dots** on latest deployment
3. Click **Redeploy**
4. Wait 1-2 minutes

---

## Part 4: Test Everything

1. Open your Vercel URL: `https://your-app.vercel.app`
2. Should see **Login page** (not white/blue screen!)
3. Click **Google Sign In** or use dev login
4. Should redirect to dashboard ✅

---

## Troubleshooting

### ❌ Still white screen on Vercel
- Check: Did you add `REACT_APP_BACKEND_URL` in Vercel?
- Check: Did you redeploy Vercel after adding env var?
- Solution: Vercel Settings → Environment Variables → verify it exists → Redeploy

### ❌ "Network Error" or API fails
- Check: Is Railway backend running? (Railway dashboard should show green "Active")
- Check: Did you set `MONGO_URL` correctly in Railway?
- Check: Did you update `CORS_ORIGINS` with exact Vercel URL?

### ❌ MongoDB connection error
- Check: Did you replace `<password>` in connection string?
- Check: Did you add `/m_dental` to the connection string?
- Check: Network Access allows 0.0.0.0/0?

---

## Quick Checklist

- [ ] MongoDB cluster created
- [ ] Database user created with password
- [ ] Network access allows 0.0.0.0/0
- [ ] Connection string copied and password replaced
- [ ] Railway project created from GitHub
- [ ] Railway environment variables added (all 6)
- [ ] Railway backend shows "Active" status
- [ ] Railway domain generated and copied
- [ ] Vercel env var `REACT_APP_BACKEND_URL` added
- [ ] Vercel redeployed
- [ ] App loads without white screen ✅

---

## Need Help?

If stuck, check:
1. **Railway Logs:** Click service → Logs tab → look for errors
2. **Vercel Build Logs:** Deployments → click deployment → View Function Logs
3. **Browser Console:** Open app → F12 → Console tab → look for errors

