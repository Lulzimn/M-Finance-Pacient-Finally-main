# M-Dental Authentication System - Migration Guide

## Overview
The system has been migrated from Google OAuth to a simple email/password authentication with role-based access control.

## Authentication Architecture

### Backend
- **Technology**: FastAPI + bcrypt password hashing
- **Session Management**: HTTP-only cookies with 7-day expiration
- **Database**: MongoDB (users and user_sessions collections)
- **Roles**: `admin` (full access) and `staff` (limited to patients, invoices, appointments)

### Frontend
- **Technology**: React with axios
- **Session Storage**: User data cached in sessionStorage
- **Protected Routes**: Role-based route guards using ProtectedRoute component

## Key Changes Made

### 1. Backend Changes (backend/server.py)

#### Removed
- All OAuth imports (`authlib`, `OAuth`, `SessionMiddleware`)
- Google OAuth configuration (`oauth.register`)
- OAuth endpoints:
  - `/auth/google/login`
  - `/auth/google/callback`
  - `/auth/microsoft/*`
  - `/auth/dev-login`
  - `process_oauth_user()` function

#### Added
- `bcrypt` for password hashing
- New endpoints:
  - **POST /api/auth/seed** - Creates initial admin and staff users
  - **POST /api/auth/login** - Email/password authentication
  - **GET /api/auth/me** - Get current user info
  - **POST /api/auth/logout** - End session

#### Updated
- `LOCKDOWN_ALLOWED_PATHS` now includes `/auth/seed` instead of `/auth/dev-login`
- Session cookies use `httponly`, `secure` (in production), and `samesite` attributes

### 2. Frontend Changes

#### LoginPage.jsx
- Removed Google OAuth button
- Replaced with simple email/password form
- Uses standard HTML form with Material UI Input components
- Albanian language error messages

#### App.js
- Simplified ProtectedRoute component
- Removed OAuth callback handling
- Improved role-based redirects

#### New Component
- `ProtectedRoute.jsx` - Standalone route protection component (not currently used but available)

### 3. Environment Variables

#### backend/.env
```bash
# Authentication credentials
ADMIN_EMAIL="lulzimn995@gmail.com"
STAFF_EMAIL="staff@mdental.com"
DEFAULT_PASSWORD="MDental2024!"

# Removed (no longer needed)
# GOOGLE_CLIENT_ID
# GOOGLE_CLIENT_SECRET
```

## Deployment Steps

### Local Testing

1. **Start Backend**
   ```bash
   cd backend
   pip install -r requirements.txt  # bcrypt already included
   python server.py
   ```

2. **Seed Users** (first time only)
   ```bash
   # Option 1: Use test script
   python test_auth.py
   
   # Option 2: Manual curl
   curl -X POST http://localhost:8000/api/auth/seed
   ```

3. **Start Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Test Login**
   - Navigate to http://localhost:3000/login
   - Admin: lulzimn995@gmail.com / MDental2024!
   - Staff: staff@mdental.com / MDental2024!

### Railway Deployment (Backend)

1. **Update Environment Variables** in Railway dashboard:
   ```
   ADMIN_EMAIL=lulzimn995@gmail.com
   STAFF_EMAIL=staff@mdental.com
   DEFAULT_PASSWORD=MDental2024!
   FRONTEND_URL=https://your-app.vercel.app
   CORS_ORIGINS=https://your-app.vercel.app
   ```

2. **Deploy** (Railway auto-deploys on git push)
   ```bash
   git add .
   git commit -m "Migrate to email/password auth"
   git push railway main
   ```

3. **Seed Users** (one-time, after deployment)
   ```bash
   curl -X POST https://your-backend.railway.app/api/auth/seed
   ```

### Vercel Deployment (Frontend)

1. **Update Environment Variables** in Vercel dashboard:
   ```
   REACT_APP_BACKEND_URL=https://your-backend.railway.app
   ```

2. **Deploy**
   ```bash
   cd frontend
   vercel --prod
   ```

## User Management

### Initial Users
Two users are created via the `/auth/seed` endpoint:
- **Admin**: Full system access (all pages)
- **Staff**: Limited access (patients, invoices, appointments only)

### Adding More Users
Currently, users can only be added manually via MongoDB:

```javascript
// Connect to MongoDB Atlas
// Insert into 'users' collection:
{
  "user_id": "user_abc123",
  "email": "newuser@mdental.com",
  "password": "$2b$12$...",  // Use bcrypt to hash password
  "name": "New User",
  "role": "staff",  // or "admin"
  "created_at": "2024-01-15T10:00:00Z"
}
```

**Note**: A user management UI can be added later in Settings page (admin only).

## Security Features

1. **Password Hashing**: bcrypt with automatic salt generation
2. **HTTP-only Cookies**: Session tokens not accessible via JavaScript
3. **Secure Cookies**: HTTPS-only in production
4. **SameSite Protection**: Prevents CSRF attacks
5. **Session Expiration**: 7-day automatic expiry
6. **Role-based Access**: Backend enforces admin-only endpoints

## Role Permissions

### Admin Role
- Access to all pages
- Can view/edit all data
- Access to financial reports, settings, activity logs
- Pages: Dashboard, Patients, Appointments, Invoices, Financat, Reports, Settings, Logs

### Staff Role
- Limited page access
- Cannot view financial summaries or system settings
- Pages: Dashboard, Patients, Invoices, Appointments

## Troubleshooting

### Login Issues

1. **"Email ose fjalëkalim i pasaktë"**
   - Verify users were seeded: Check MongoDB `users` collection
   - Verify password matches DEFAULT_PASSWORD in .env
   - Check backend logs for bcrypt errors

2. **Cookie not being set**
   - Verify FRONTEND_URL matches actual frontend URL
   - Check CORS_ORIGINS includes frontend domain
   - Ensure axios.defaults.withCredentials = true in frontend

3. **Redirected to /login after successful login**
   - Check browser console for errors
   - Verify session_token cookie is set (DevTools > Application > Cookies)
   - Test /api/auth/me endpoint manually

### Database Issues

1. **Users not created**
   - Verify MONGO_URL is correct in .env
   - Check MongoDB Atlas network access (whitelist IP)
   - View backend logs during seed operation

2. **Sessions not persisting**
   - Check `user_sessions` collection in MongoDB
   - Verify session_token in cookies matches database
   - Check expires_at timestamp

## Testing Checklist

- [ ] Backend starts without errors
- [ ] /api/auth/seed creates users successfully
- [ ] Admin login works
- [ ] Staff login works
- [ ] Wrong password is rejected
- [ ] /api/auth/me returns user info when logged in
- [ ] /api/auth/logout clears session
- [ ] Admin can access /admin routes
- [ ] Staff cannot access /admin/financat
- [ ] Staff can access /staff/patients
- [ ] Cookies are set with correct attributes
- [ ] Frontend redirects work correctly
- [ ] Session persists across page refreshes

## Next Steps

### Recommended Enhancements

1. **User Management UI** (Admin only)
   - Add users from Settings page
   - Change passwords
   - Disable/enable accounts

2. **Password Reset**
   - "Forgot Password" link
   - Email-based reset flow using SendGrid

3. **Activity Logging**
   - Log all login attempts
   - Track failed authentications
   - Monitor session creation/deletion

4. **Password Policy**
   - Minimum length requirement
   - Complexity rules (uppercase, numbers, symbols)
   - Password expiration

5. **Multi-Factor Authentication (MFA)**
   - SMS or email verification codes
   - Authenticator app support

## Support

For issues or questions:
- Check backend logs: `railway logs` or local console output
- Check frontend console: Browser DevTools
- Verify MongoDB data: MongoDB Atlas dashboard
- Review this guide's troubleshooting section

---

**Last Updated**: January 2025  
**Version**: 2.0 (Email/Password Auth)
