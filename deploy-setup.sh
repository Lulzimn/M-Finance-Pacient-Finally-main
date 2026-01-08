#!/bin/bash

# 🚀 Quick Start Script për Deploy në Render.com

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🚀 M-Dental Deployment Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check if git is initialized
if [ ! -d ".git" ]; then
    echo "📦 Initializing Git repository..."
    git init
    git add .
    git commit -m "Initial commit - Ready for deployment"
    echo "✅ Git initialized"
else
    echo "✅ Git already initialized"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 HAPA TË DEPLOYMENT-IT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1️⃣  Krijo account në Render.com: https://render.com"
echo "2️⃣  Connect GitHub repository ose upload direct"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔧 BACKEND SETUP në Render:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   • Name: m-dental-backend"
echo "   • Region: Frankfurt"
echo "   • Root Directory: backend"
echo "   • Build Command: pip install -r requirements.txt"
echo "   • Start Command: uvicorn server:app --host 0.0.0.0 --port \$PORT"
echo ""
echo "   Environment Variables (kopjo nga backend/.env):"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Read and display environment variables (masking sensitive data)
if [ -f "backend/.env" ]; then
    echo "   MONGO_URL=..."
    echo "   DB_NAME=m_dental"
    echo "   SENDGRID_API_KEY=..."
    echo "   SENDER_EMAIL=staffmdental@gmail.com"
    echo "   ENVIRONMENT=production"
    echo "   CORS_ORIGINS=https://your-frontend-url.com"
else
    echo "   ⚠️  backend/.env not found!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎨 FRONTEND SETUP në Render/Vercel:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   • Name: m-dental-frontend"
echo "   • Root Directory: frontend"
echo "   • Build Command: npm install && npm run build"
echo "   • Publish Directory: build"
echo ""
echo "   Environment Variables:"
echo "   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "   REACT_APP_API_URL=https://m-dental-backend.onrender.com"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Për udhëzime të detajuara, lexo DEPLOYMENT.md"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Projekti është gati për deployment!"
echo "🔗 Hapë Render.com dhe fillo deployment-in"
echo ""
