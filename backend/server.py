from fastapi import FastAPI, APIRouter, HTTPException, Response, Request, Depends
from fastapi.responses import StreamingResponse, RedirectResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import asyncio
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
from io import BytesIO
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from authlib.integrations.starlette_client import OAuth

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# Environment check
IS_PRODUCTION = os.environ.get('ENVIRONMENT', 'development') == 'production'

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI(title="M-Dental Financial Management")

# OAuth Configuration
oauth = OAuth()

# Google OAuth
oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# Microsoft OAuth
oauth.register(
    name='microsoft',
    client_id=os.environ.get('MICROSOFT_CLIENT_ID'),
    client_secret=os.environ.get('MICROSOFT_CLIENT_SECRET'),
    authorize_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    authorize_params=None,
    access_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
    access_token_params=None,
    refresh_token_url=None,
    client_kwargs={'scope': 'openid email profile'}
)

# Lockdown mode to disable all non-auth endpoints during personalization
LOCKDOWN_MODE = os.environ.get('LOCKDOWN_MODE', 'false').lower() == 'true'
LOCKDOWN_ALLOWED_PATHS = {
    "/api/auth/session",
    "/api/auth/logout",
    "/api/auth/me",
    "/api/auth/dev-login",
}

# Create router with /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# SendGrid configuration
SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY')
SENDER_EMAIL = os.environ.get('SENDER_EMAIL', 'staffmdental@gmail.com')

# Admin emails list - first registered user becomes admin, or add emails here
ADMIN_EMAILS = ["lulzimn995@gmail.com", "lulzim.aga1995@gmail.com"]

# Lightweight health probe (does not require DB to be fully ready)
@app.get("/health")
async def health() -> Dict[str, Any]:
    status: Dict[str, Any] = {
        "status": "ok",
        "env": "production" if IS_PRODUCTION else "development",
    }
    try:
        # Quick ping; if Mongo URL is misconfigured this will raise
        await client.admin.command("ping")
        status["db"] = "ok"
    except Exception as e:
        # Don’t crash health; surface useful info instead
        status["db"] = f"error: {str(e)[:120]}"
    return status

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "staff"  # admin or staff
    created_at: datetime

class UserCreate(BaseModel):
    email: str
    name: str
    picture: Optional[str] = None
    role: str = "staff"

class Patient(BaseModel):
    model_config = ConfigDict(extra="ignore")
    patient_id: str = Field(default_factory=lambda: f"pat_{uuid.uuid4().hex[:12]}")
    emri: str
    mbiemri: str
    telefon: Optional[str] = None
    email: Optional[str] = None
    adresa: Optional[str] = None
    shenimet: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class PatientCreate(BaseModel):
    emri: str
    mbiemri: str
    telefon: Optional[str] = None
    email: Optional[str] = None
    adresa: Optional[str] = None
    shenimet: Optional[str] = None
    ditelindja: Optional[str] = None

class InvoiceItem(BaseModel):
    description: str
    quantity: float = 1
    unit_price: float = 0
    total: float = 0

class Invoice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    invoice_id: str = Field(default_factory=lambda: f"inv_{uuid.uuid4().hex[:12]}")
    invoice_number: str = ""
    patient_id: str
    patient_name: Optional[str] = None
    items: List[InvoiceItem] = []
    subtotal: float = 0
    tax_rate: float = 18
    tax_amount: float = 0
    total_amount: float = 0
    valuta: str = "MKD"
    statusi: str = "draft"  # draft, sent, paid, cancelled
    issue_date: str = ""
    due_date: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class InvoiceCreate(BaseModel):
    invoice_number: Optional[str] = None
    patient_id: str
    items: List[Dict[str, Any]] = []
    subtotal: float = 0
    tax_rate: float = 18
    tax_amount: float = 0
    total_amount: float = 0
    valuta: str = "MKD"
    statusi: str = "draft"
    issue_date: Optional[str] = None
    due_date: Optional[str] = None
    notes: Optional[str] = None

class CashInflow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    inflow_id: str = Field(default_factory=lambda: f"in_{uuid.uuid4().hex[:12]}")
    kategoria: str  # pagesa_pacient, sherbim_dentar, tjeter
    pershkrimi: str
    shuma: float
    valuta: str = "MKD"
    metoda_pageses: str = "cash"  # cash, karte, transfer
    patient_id: Optional[str] = None
    invoice_id: Optional[str] = None
    data: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class CashInflowCreate(BaseModel):
    kategoria: str
    pershkrimi: str
    shuma: float
    valuta: str = "MKD"
    metoda_pageses: str = "cash"
    patient_id: Optional[str] = None
    invoice_id: Optional[str] = None

class CashOutflow(BaseModel):
    model_config = ConfigDict(extra="ignore")
    outflow_id: str = Field(default_factory=lambda: f"out_{uuid.uuid4().hex[:12]}")
    kategoria: str  # furnizime, qira, paga, operative, tjeter
    pershkrimi: str
    shuma: float
    valuta: str = "MKD"
    data: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class CashOutflowCreate(BaseModel):
    kategoria: str
    pershkrimi: str
    shuma: float
    valuta: str = "MKD"

class ExchangeRate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    rate_id: str = Field(default_factory=lambda: f"rate_{uuid.uuid4().hex[:12]}")
    eur_to_mkd: float = 61.5
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_by: Optional[str] = None

class ExchangeRateUpdate(BaseModel):
    eur_to_mkd: float

class ActivityLog(BaseModel):
    model_config = ConfigDict(extra="ignore")
    log_id: str = Field(default_factory=lambda: f"log_{uuid.uuid4().hex[:12]}")
    user_id: str
    user_name: str
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Appointment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    appointment_id: str = Field(default_factory=lambda: f"apt_{uuid.uuid4().hex[:12]}")
    patient_id: str
    patient_name: Optional[str] = None
    patient_email: Optional[str] = None
    data_termini: str  # Date in YYYY-MM-DD format
    ora: str  # Time in HH:MM format
    arsyeja: str
    statusi: str = "scheduled"  # scheduled, completed, cancelled
    shenimet: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    created_by: Optional[str] = None

class AppointmentCreate(BaseModel):
    patient_id: str
    data_termini: str
    ora: str
    arsyeja: str
    shenimet: Optional[str] = None
    send_email: bool = True

# ==================== AUTH HELPERS ====================

async def get_current_user(request: Request) -> Dict[str, Any]:
    """Get current user from session token cookie or Authorization header"""
    session_token = request.cookies.get("session_token")
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header[7:]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Nuk jeni autentikuar")
    
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Sesioni i pavlefshëm")
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if hasattr(expires_at, 'tzinfo') and expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if isinstance(expires_at, datetime) and expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Sesioni ka skaduar")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Përdoruesi nuk u gjet")
    
    return user

async def require_admin(request: Request) -> Dict[str, Any]:
    """Require admin role"""
    user = await get_current_user(request)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Vetëm administratorët kanë akses")
    return user

async def log_activity(user_id: str, user_name: str, action: str, entity_type: str, entity_id: Optional[str] = None, details: Optional[str] = None) -> None:
    """Log user activity"""
    log = ActivityLog(
        user_id=user_id,
        user_name=user_name,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    log_dict = log.model_dump()
    log_dict["timestamp"] = log_dict["timestamp"].isoformat()
    await db.activity_logs.insert_one(log_dict)

# ==================== AUTH ENDPOINTS ====================

@api_router.get("/auth/google/login")
async def google_login(request: Request):
    """Initiate Google OAuth login"""
    redirect_uri = request.url_for('google_callback')
    return await oauth.google.authorize_redirect(request, redirect_uri)

@api_router.get("/auth/google/callback")
async def google_callback(request: Request, response: Response):
    """Handle Google OAuth callback"""
    try:
        token = await oauth.google.authorize_access_token(request)
        user_data = token.get('userinfo')
        
        if not user_data:
            raise HTTPException(status_code=401, detail="Nuk u morën të dhënat e përdoruesit")
        
        # Get or create user
        user_id = await process_oauth_user(
            email=user_data.get('email'),
            name=user_data.get('name'),
            picture=user_data.get('picture')
        )
        
        # Create session
        session_token = f"session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.delete_many({"user_id": user_id})
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Set cookie
        samesite_value = "none" if IS_PRODUCTION else "lax"
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=IS_PRODUCTION,
            samesite=samesite_value,
            path="/",
            max_age=7*24*60*60
        )
        
        # Get user role and redirect
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        redirect_path = "/admin" if user.get("role") == "admin" else "/staff"
        
        # Redirect to frontend
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}{redirect_path}")
        
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(status_code=401, detail=f"Gabim në autentikim: {str(e)}")

@api_router.get("/auth/microsoft/login")
async def microsoft_login(request: Request):
    """Initiate Microsoft OAuth login"""
    redirect_uri = request.url_for('microsoft_callback')
    return await oauth.microsoft.authorize_redirect(request, redirect_uri)

@api_router.get("/auth/microsoft/callback")
async def microsoft_callback(request: Request, response: Response):
    """Handle Microsoft OAuth callback"""
    try:
        token = await oauth.microsoft.authorize_access_token(request)
        
        # Get user info from Microsoft Graph API
        async with httpx.AsyncClient() as client_http:
            resp = await client_http.get(
                'https://graph.microsoft.com/v1.0/me',
                headers={'Authorization': f'Bearer {token["access_token"]}'}
            )
            if resp.status_code != 200:
                raise HTTPException(status_code=401, detail="Nuk u morën të dhënat e përdoruesit")
            
            user_data = resp.json()
        
        # Get or create user
        user_id = await process_oauth_user(
            email=user_data.get('mail') or user_data.get('userPrincipalName'),
            name=user_data.get('displayName'),
            picture=None  # Microsoft doesn't provide picture in basic scope
        )
        
        # Create session
        session_token = f"session_{uuid.uuid4().hex}"
        expires_at = datetime.now(timezone.utc) + timedelta(days=7)
        
        await db.user_sessions.delete_many({"user_id": user_id})
        await db.user_sessions.insert_one({
            "user_id": user_id,
            "session_token": session_token,
            "expires_at": expires_at.isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        
        # Set cookie
        samesite_value = "none" if IS_PRODUCTION else "lax"
        response.set_cookie(
            key="session_token",
            value=session_token,
            httponly=True,
            secure=IS_PRODUCTION,
            samesite=samesite_value,
            path="/",
            max_age=7*24*60*60
        )
        
        # Get user role and redirect
        user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        redirect_path = "/admin" if user.get("role") == "admin" else "/staff"
        
        # Redirect to frontend
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:3000')
        return RedirectResponse(url=f"{frontend_url}{redirect_path}")
        
    except Exception as e:
        logger.error(f"Microsoft auth error: {e}")
        raise HTTPException(status_code=401, detail=f"Gabim në autentikim: {str(e)}")

async def process_oauth_user(email: str, name: str, picture: Optional[str] = None) -> str:
    """Process OAuth user - create or update user and return user_id"""
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": name,
                "picture": picture
            }}
        )
        return user_id
    else:
        # Check if this is the first user (make them admin) or if email is in admin list
        users_count = await db.users.count_documents({})
        is_admin_email = email in ADMIN_EMAILS
        is_first_user = users_count == 0
        
        # First user becomes admin automatically
        if is_first_user:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_user)
            await log_activity(user_id, name, "REGJISTRUAR", "user", user_id, "Përdorues i parë u regjistrua si admin")
            return user_id
        elif is_admin_email:
            # Email is in admin list - make them admin
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_user)
            await log_activity(user_id, name, "REGJISTRUAR", "user", user_id, "Përdorues u regjistrua si admin (email i aprovuar)")
            return user_id
        else:
            # All other users go to pending - need admin approval
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": picture,
                "role": "pending",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_user)
            await log_activity(user_id, name, "REGJISTRUAR_PRITJE", "user", user_id, "Përdorues në pritje për aprovim")
            raise HTTPException(status_code=403, detail="Llogaria juaj është në pritje për aprovim nga administratori")

@api_router.get("/auth/session")
async def process_session(session_id: str, response: Response) -> Dict[str, Any]:
    """Legacy endpoint - kept for backwards compatibility but not used"""
    raise HTTPException(status_code=410, detail="Kjo metodë e autentikimit nuk përdoret më. Ju lutemi përdorni Google ose Microsoft OAuth.")

@api_router.get("/auth/me")
async def get_me(request: Request) -> Dict[str, Any]:
    """Get current authenticated user"""
    user = await get_current_user(request)
    return user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response) -> Dict[str, str]:
    """Logout user"""
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_many({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Dilni me sukses"}

@api_router.post("/auth/dev-login")
async def dev_login(email: str, name: str, response: Response) -> Dict[str, Any]:
    """Development login endpoint - bypasses Emergent Auth (DEV ONLY)"""
    if os.getenv("LOCKDOWN_MODE") == "true":
        raise HTTPException(status_code=403, detail="Të paautorizuar")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        # Update user data
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": name,
            }}
        )
    else:
        # Check if this is the first user (make them admin) or if email is in admin list
        users_count = await db.users.count_documents({})
        is_admin_email = email in ADMIN_EMAILS
        is_first_user = users_count == 0
        
        # First user becomes admin automatically
        if is_first_user or is_admin_email:
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": None,
                "role": "admin",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_user)
            await log_activity(user_id, name, "REGJISTRUAR", "user", user_id, "Përdorues u regjistrua si admin (dev login)")
        else:
            # All other users go to staff
            user_id = f"user_{uuid.uuid4().hex[:12]}"
            new_user = {
                "user_id": user_id,
                "email": email,
                "name": name,
                "picture": None,
                "role": "staff",
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.users.insert_one(new_user)
            await log_activity(user_id, name, "REGJISTRUAR", "user", user_id, "Përdorues u regjistrua si staff (dev login)")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    # Set cookie
    samesite_value = "none" if IS_PRODUCTION else "lax"
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=IS_PRODUCTION,  # Only secure in production
        samesite=samesite_value,
        path="/",
        max_age=7*24*60*60
    )
    
    # Get user with role
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=500, detail="Gabim në krijimin e përdoruesit")
    
    return user

# ==================== USER MANAGEMENT (Admin Only) ====================

@api_router.get("/users", response_model=List[Dict[str, Any]])
async def get_users(request: Request) -> List[Dict[str, Any]]:
    """Get all users (admin only)"""
    await require_admin(request)
    users = await db.users.find({}, {"_id": 0}).to_list(1000)
    return users

@api_router.put("/users/{user_id}/role")
async def update_user_role(user_id: str, role: str, request: Request) -> Dict[str, str]:
    """Update user role (admin only)"""
    admin = await require_admin(request)
    
    if role not in ["admin", "staff", "pending"]:
        raise HTTPException(status_code=400, detail="Roli i pavlefshëm")
    
    # Check if user exists first
    existing_user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if not existing_user:
        raise HTTPException(status_code=404, detail="Përdoruesi nuk u gjet")
    
    # Don't update if role is the same
    if existing_user.get("role") == role:
        return {"message": "Roli është i njëjtë"}
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": role}}
    )
    
    await log_activity(admin["user_id"], admin["name"], "NDRYSHOI_ROL", "user", user_id, f"Roli u ndryshua në {role}")
    
    return {"message": "Roli u përditësua"}

@api_router.delete("/users/{user_id}")
async def delete_user(user_id: str, request: Request) -> Dict[str, str]:
    """Delete user (admin only)"""
    admin = await require_admin(request)
    
    if admin["user_id"] == user_id:
        raise HTTPException(status_code=400, detail="Nuk mund të fshini veten")
    
    result = await db.users.delete_one({"user_id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Përdoruesi nuk u gjet")
    
    # Delete user sessions too
    await db.user_sessions.delete_many({"user_id": user_id})
    
    await log_activity(admin["user_id"], admin["name"], "FSHIU", "user", user_id)
    
    return {"message": "Përdoruesi u fshi"}

# ==================== PATIENTS ====================

@api_router.get("/patients", response_model=List[Dict[str, Any]])
async def get_patients(request: Request) -> List[Dict[str, Any]]:
    """Get all patients"""
    await get_current_user(request)
    patients = await db.patients.find({}, {"_id": 0}).to_list(1000)
    return patients

@api_router.get("/patients/{patient_id}")
async def get_patient(patient_id: str, request: Request) -> Dict[str, Any]:
    """Get single patient"""
    await get_current_user(request)
    patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Pacienti nuk u gjet")
    return patient

@api_router.post("/patients", response_model=Dict[str, Any])
async def create_patient(data: PatientCreate, request: Request) -> Dict[str, Any]:
    """Create new patient"""
    user = await get_current_user(request)
    
    patient = Patient(**data.model_dump(), created_by=user["user_id"])
    patient_dict = patient.model_dump()
    patient_dict["created_at"] = patient_dict["created_at"].isoformat()
    
    # Insert into database
    await db.patients.insert_one(patient_dict.copy())
    await log_activity(user["user_id"], user["name"], "KRIJOI", "patient", patient.patient_id, f"Pacienti: {data.emri} {data.mbiemri}")
    
    # Remove any _id field that might have been added
    patient_dict.pop("_id", None)
    return patient_dict

@api_router.put("/patients/{patient_id}")
async def update_patient(patient_id: str, data: PatientCreate, request: Request) -> Dict[str, str]:
    """Update patient"""
    user = await get_current_user(request)
    
    result = await db.patients.update_one(
        {"patient_id": patient_id},
        {"$set": data.model_dump()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Pacienti nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "PËRDITËSOI", "patient", patient_id, f"Pacienti: {data.emri} {data.mbiemri}")
    
    return {"message": "Pacienti u përditësua"}

@api_router.delete("/patients/{patient_id}")
async def delete_patient(patient_id: str, request: Request) -> Dict[str, str]:
    """Delete patient (admin only)"""
    user = await require_admin(request)
    
    patient = await db.patients.find_one({"patient_id": patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Pacienti nuk u gjet")
    
    await db.patients.delete_one({"patient_id": patient_id})
    await log_activity(user["user_id"], user["name"], "FSHIU", "patient", patient_id, f"Pacienti: {patient['emri']} {patient['mbiemri']}")
    
    return {"message": "Pacienti u fshi"}

# ==================== INVOICES ====================

@api_router.get("/invoices", response_model=List[Dict[str, Any]])
async def get_invoices(request: Request, patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all invoices"""
    await get_current_user(request)
    
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    
    invoices = await db.invoices.find(query, {"_id": 0}).to_list(1000)
    return invoices

def generate_invoice_number() -> str:
    """Generate unique invoice number"""
    now = datetime.now(timezone.utc)
    random_part = uuid.uuid4().hex[:4].upper()
    return f"INV-{now.year}{now.month:02d}-{random_part}"

@api_router.post("/invoices", response_model=Dict[str, Any])
async def create_invoice(data: InvoiceCreate, request: Request) -> Dict[str, Any]:
    """Create new invoice"""
    user = await get_current_user(request)
    
    # Get patient name
    patient = await db.patients.find_one({"patient_id": data.patient_id}, {"_id": 0})
    patient_name = f"{patient['emri']} {patient['mbiemri']}" if patient else "I panjohur"
    
    # Generate invoice number if not provided
    invoice_number = data.invoice_number or generate_invoice_number()
    issue_date = data.issue_date or datetime.now(timezone.utc).strftime("%Y-%m-%d")
    
    invoice_dict = {
        "invoice_id": f"inv_{uuid.uuid4().hex[:12]}",
        "invoice_number": invoice_number,
        "patient_id": data.patient_id,
        "patient_name": patient_name,
        "items": data.items,
        "subtotal": data.subtotal,
        "tax_rate": data.tax_rate,
        "tax_amount": data.tax_amount,
        "total_amount": data.total_amount,
        "valuta": data.valuta,
        "statusi": data.statusi,
        "issue_date": issue_date,
        "due_date": data.due_date,
        "notes": data.notes,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": user["user_id"]
    }
    
    await db.invoices.insert_one(invoice_dict.copy())
    await log_activity(user["user_id"], user["name"], "KRIJOI", "invoice", invoice_dict["invoice_id"], f"Fatura: {invoice_number}")
    
    invoice_dict.pop("_id", None)
    return invoice_dict

@api_router.put("/invoices/{invoice_id}")
async def update_invoice(invoice_id: str, data: InvoiceCreate, request: Request) -> Dict[str, str]:
    """Update invoice"""
    user = await get_current_user(request)
    
    # Get patient name if patient_id changed
    patient = await db.patients.find_one({"patient_id": data.patient_id}, {"_id": 0})
    patient_name = f"{patient['emri']} {patient['mbiemri']}" if patient else "I panjohur"
    
    update_data = data.model_dump()
    update_data["patient_name"] = patient_name
    
    result = await db.invoices.update_one(
        {"invoice_id": invoice_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Fatura nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "PËRDITËSOI", "invoice", invoice_id)
    
    return {"message": "Fatura u përditësua"}

@api_router.delete("/invoices/{invoice_id}")
async def delete_invoice(invoice_id: str, request: Request) -> Dict[str, str]:
    """Delete invoice (admin only)"""
    user = await require_admin(request)
    
    result = await db.invoices.delete_one({"invoice_id": invoice_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Fatura nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "FSHIU", "invoice", invoice_id)
    
    return {"message": "Fatura u fshi"}

# ==================== CASH INFLOWS ====================

@api_router.get("/inflows", response_model=List[Dict[str, Any]])
async def get_inflows(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None, valuta: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all cash inflows"""
    await require_admin(request)
    
    query = {}
    if start_date and end_date:
        query["data"] = {"$gte": start_date, "$lte": end_date}
    if valuta:
        query["valuta"] = valuta
    
    inflows = await db.inflows.find(query, {"_id": 0}).to_list(1000)
    return inflows

@api_router.post("/inflows", response_model=Dict[str, Any])
async def create_inflow(data: CashInflowCreate, request: Request) -> Dict[str, Any]:
    """Create cash inflow"""
    user = await require_admin(request)
    
    inflow = CashInflow(**data.model_dump(), created_by=user["user_id"])
    inflow_dict = inflow.model_dump()
    inflow_dict["data"] = inflow_dict["data"].isoformat()
    
    # Insert into database
    await db.inflows.insert_one(inflow_dict.copy())
    await log_activity(user["user_id"], user["name"], "KRIJOI", "inflow", inflow.inflow_id, f"Hyrje: {data.shuma} {data.valuta}")
    
    # If linked to invoice, update invoice status
    if data.invoice_id:
        await db.invoices.update_one({"invoice_id": data.invoice_id}, {"$set": {"statusi": "paid"}})
    
    # Remove any _id field that might have been added
    inflow_dict.pop("_id", None)
    return inflow_dict

@api_router.put("/inflows/{inflow_id}")
async def update_inflow(inflow_id: str, data: CashInflowCreate, request: Request) -> Dict[str, str]:
    """Update cash inflow"""
    user = await require_admin(request)
    
    result = await db.inflows.update_one(
        {"inflow_id": inflow_id},
        {"$set": data.model_dump()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Hyrja nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "PËRDITËSOI", "inflow", inflow_id)
    
    return {"message": "Hyrja u përditësua"}

@api_router.delete("/inflows/{inflow_id}")
async def delete_inflow(inflow_id: str, request: Request) -> Dict[str, str]:
    """Delete cash inflow"""
    user = await require_admin(request)
    
    result = await db.inflows.delete_one({"inflow_id": inflow_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Hyrja nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "FSHIU", "inflow", inflow_id)
    
    return {"message": "Hyrja u fshi"}

# ==================== CASH OUTFLOWS ====================

@api_router.get("/outflows", response_model=List[Dict[str, Any]])
async def get_outflows(request: Request, start_date: Optional[str] = None, end_date: Optional[str] = None, valuta: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all cash outflows"""
    await require_admin(request)
    
    query = {}
    if start_date and end_date:
        query["data"] = {"$gte": start_date, "$lte": end_date}
    if valuta:
        query["valuta"] = valuta
    
    outflows = await db.outflows.find(query, {"_id": 0}).to_list(1000)
    return outflows

@api_router.post("/outflows", response_model=Dict[str, Any])
async def create_outflow(data: CashOutflowCreate, request: Request) -> Dict[str, Any]:
    """Create cash outflow"""
    user = await require_admin(request)
    
    outflow = CashOutflow(**data.model_dump(), created_by=user["user_id"])
    outflow_dict = outflow.model_dump()
    outflow_dict["data"] = outflow_dict["data"].isoformat()
    
    # Insert into database
    await db.outflows.insert_one(outflow_dict.copy())
    await log_activity(user["user_id"], user["name"], "KRIJOI", "outflow", outflow.outflow_id, f"Dalje: {data.shuma} {data.valuta}")
    
    # Remove any _id field that might have been added
    outflow_dict.pop("_id", None)
    return outflow_dict

@api_router.put("/outflows/{outflow_id}")
async def update_outflow(outflow_id: str, data: CashOutflowCreate, request: Request) -> Dict[str, str]:
    """Update cash outflow"""
    user = await require_admin(request)
    
    result = await db.outflows.update_one(
        {"outflow_id": outflow_id},
        {"$set": data.model_dump()}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Dalja nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "PËRDITËSOI", "outflow", outflow_id)
    
    return {"message": "Dalja u përditësua"}

@api_router.delete("/outflows/{outflow_id}")
async def delete_outflow(outflow_id: str, request: Request) -> Dict[str, str]:
    """Delete cash outflow"""
    user = await require_admin(request)
    
    result = await db.outflows.delete_one({"outflow_id": outflow_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Dalja nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "FSHIU", "outflow", outflow_id)
    
    return {"message": "Dalja u fshi"}

# ==================== EXCHANGE RATE ====================

@api_router.get("/exchange-rate")
async def get_exchange_rate(request: Request) -> Dict[str, Any]:
    """Get current exchange rate"""
    await get_current_user(request)
    
    rate = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("updated_at", -1)])
    if not rate:
        # Create default rate
        default_rate = ExchangeRate()
        rate_dict = default_rate.model_dump()
        rate_dict["updated_at"] = rate_dict["updated_at"].isoformat()
        await db.exchange_rates.insert_one(rate_dict)
        # Remove _id field that MongoDB adds automatically
        rate_dict.pop("_id", None)
        return rate_dict
    
    return rate

@api_router.put("/exchange-rate")
async def update_exchange_rate(data: ExchangeRateUpdate, request: Request) -> Dict[str, Any]:
    """Update exchange rate (admin only)"""
    user = await require_admin(request)
    
    new_rate = ExchangeRate(eur_to_mkd=data.eur_to_mkd, updated_by=user["user_id"])
    rate_dict = new_rate.model_dump()
    rate_dict["updated_at"] = rate_dict["updated_at"].isoformat()
    
    # Insert into database
    await db.exchange_rates.insert_one(rate_dict.copy())
    await log_activity(user["user_id"], user["name"], "PËRDITËSOI", "exchange_rate", new_rate.rate_id, f"Kursi: 1 EUR = {data.eur_to_mkd} MKD")
    
    # Remove any _id field that might have been added
    rate_dict.pop("_id", None)
    return rate_dict

# ==================== DASHBOARD / REPORTS ====================

@api_router.get("/dashboard/stats")
async def get_dashboard_stats(request: Request) -> Dict[str, Any]:
    """Get dashboard statistics"""
    user = await get_current_user(request)
    
    # Get exchange rate
    rate_doc = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("updated_at", -1)])
    exchange_rate = rate_doc["eur_to_mkd"] if rate_doc else 61.5
    
    # Today's date range
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow = today + timedelta(days=1)
    
    # This month's date range
    first_of_month = today.replace(day=1)
    
    # Calculate inflows
    all_inflows = await db.inflows.find({}, {"_id": 0}).to_list(10000)
    total_inflows_mkd = 0
    today_inflows_mkd = 0
    month_inflows_mkd = 0
    
    for inflow in all_inflows:
        amount_mkd = inflow["shuma"]
        if inflow["valuta"] == "EUR":
            amount_mkd = inflow["shuma"] * exchange_rate
        total_inflows_mkd += amount_mkd
        
        inflow_date = datetime.fromisoformat(inflow["data"]) if isinstance(inflow["data"], str) else inflow["data"]
        if inflow_date.tzinfo is None:
            inflow_date = inflow_date.replace(tzinfo=timezone.utc)
        
        if today <= inflow_date < tomorrow:
            today_inflows_mkd += amount_mkd
        if first_of_month <= inflow_date:
            month_inflows_mkd += amount_mkd
    
    # Calculate outflows
    all_outflows = await db.outflows.find({}, {"_id": 0}).to_list(10000)
    total_outflows_mkd = 0
    today_outflows_mkd = 0
    month_outflows_mkd = 0
    
    for outflow in all_outflows:
        amount_mkd = outflow["shuma"]
        if outflow["valuta"] == "EUR":
            amount_mkd = outflow["shuma"] * exchange_rate
        total_outflows_mkd += amount_mkd
        
        outflow_date = datetime.fromisoformat(outflow["data"]) if isinstance(outflow["data"], str) else outflow["data"]
        if outflow_date.tzinfo is None:
            outflow_date = outflow_date.replace(tzinfo=timezone.utc)
        
        if today <= outflow_date < tomorrow:
            today_outflows_mkd += amount_mkd
        if first_of_month <= outflow_date:
            month_outflows_mkd += amount_mkd
    
    # Count entities
    patients_count = await db.patients.count_documents({})
    invoices_pending = await db.invoices.count_documents({"statusi": "pending"})
    
    balance_mkd = total_inflows_mkd - total_outflows_mkd
    
    return {
        "total_inflows_mkd": round(total_inflows_mkd, 2),
        "total_inflows_eur": round(total_inflows_mkd / exchange_rate, 2),
        "total_outflows_mkd": round(total_outflows_mkd, 2),
        "total_outflows_eur": round(total_outflows_mkd / exchange_rate, 2),
        "balance_mkd": round(balance_mkd, 2),
        "balance_eur": round(balance_mkd / exchange_rate, 2),
        "today_inflows_mkd": round(today_inflows_mkd, 2),
        "today_outflows_mkd": round(today_outflows_mkd, 2),
        "month_inflows_mkd": round(month_inflows_mkd, 2),
        "month_outflows_mkd": round(month_outflows_mkd, 2),
        "patients_count": patients_count,
        "invoices_pending": invoices_pending,
        "exchange_rate": exchange_rate
    }

@api_router.get("/reports/monthly")
async def get_monthly_report(request: Request, year: Optional[int] = None, month: Optional[int] = None) -> Dict[str, Any]:
    """Get monthly financial report"""
    await require_admin(request)
    
    if not year:
        year = datetime.now(timezone.utc).year
    if not month:
        month = datetime.now(timezone.utc).month
    
    # Get exchange rate
    rate_doc = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("updated_at", -1)])
    exchange_rate = rate_doc["eur_to_mkd"] if rate_doc else 61.5
    
    # Get all data for the month
    start_date = datetime(year, month, 1, tzinfo=timezone.utc)
    if month == 12:
        end_date = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        end_date = datetime(year, month + 1, 1, tzinfo=timezone.utc)
    
    all_inflows = await db.inflows.find({}, {"_id": 0}).to_list(10000)
    all_outflows = await db.outflows.find({}, {"_id": 0}).to_list(10000)
    
    # Daily breakdown
    daily_data = {}
    for day in range(1, 32):
        try:
            date_key = f"{year}-{month:02d}-{day:02d}"
            daily_data[date_key] = {"inflows": 0, "outflows": 0}
        except:
            break
    
    # Process inflows
    inflows_by_category = {}
    total_inflows = 0
    for inflow in all_inflows:
        inflow_date = datetime.fromisoformat(inflow["data"]) if isinstance(inflow["data"], str) else inflow["data"]
        if inflow_date.tzinfo is None:
            inflow_date = inflow_date.replace(tzinfo=timezone.utc)
        
        if start_date <= inflow_date < end_date:
            amount_mkd = inflow["shuma"] if inflow["valuta"] == "MKD" else inflow["shuma"] * exchange_rate
            total_inflows += amount_mkd
            
            date_key = inflow_date.strftime("%Y-%m-%d")
            if date_key in daily_data:
                daily_data[date_key]["inflows"] += amount_mkd
            
            cat = inflow.get("kategoria", "tjeter")
            inflows_by_category[cat] = inflows_by_category.get(cat, 0) + amount_mkd
    
    # Process outflows
    outflows_by_category = {}
    total_outflows = 0
    for outflow in all_outflows:
        outflow_date = datetime.fromisoformat(outflow["data"]) if isinstance(outflow["data"], str) else outflow["data"]
        if outflow_date.tzinfo is None:
            outflow_date = outflow_date.replace(tzinfo=timezone.utc)
        
        if start_date <= outflow_date < end_date:
            amount_mkd = outflow["shuma"] if outflow["valuta"] == "MKD" else outflow["shuma"] * exchange_rate
            total_outflows += amount_mkd
            
            date_key = outflow_date.strftime("%Y-%m-%d")
            if date_key in daily_data:
                daily_data[date_key]["outflows"] += amount_mkd
            
            cat = outflow.get("kategoria", "tjeter")
            outflows_by_category[cat] = outflows_by_category.get(cat, 0) + amount_mkd
    
    return {
        "year": year,
        "month": month,
        "total_inflows_mkd": round(total_inflows, 2),
        "total_outflows_mkd": round(total_outflows, 2),
        "balance_mkd": round(total_inflows - total_outflows, 2),
        "inflows_by_category": {k: round(v, 2) for k, v in inflows_by_category.items()},
        "outflows_by_category": {k: round(v, 2) for k, v in outflows_by_category.items()},
        "daily_data": [{
            "date": k,
            "inflows": round(v["inflows"], 2),
            "outflows": round(v["outflows"], 2)
        } for k, v in daily_data.items() if v["inflows"] > 0 or v["outflows"] > 0],
        "exchange_rate": exchange_rate
    }

# ==================== ACTIVITY LOGS ====================

@api_router.get("/activity-logs", response_model=List[Dict[str, Any]])
async def get_activity_logs(request: Request, limit: int = 100) -> List[Dict[str, Any]]:
    """Get activity logs (admin only)"""
    await require_admin(request)
    
    logs = await db.activity_logs.find({}, {"_id": 0}).sort("timestamp", -1).to_list(limit)
    return logs

# ==================== EXPORT ====================

@api_router.get("/export/excel")
async def export_excel(request: Request, type: str = "inflows", start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Export data to Excel"""
    await require_admin(request)
    
    import xlsxwriter
    
    output = BytesIO()
    workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    worksheet = workbook.add_worksheet()
    
    # Headers style
    header_format = workbook.add_format({'bold': True, 'bg_color': '#0284c7', 'font_color': 'white'})
    
    if type == "inflows":
        data = await db.inflows.find({}, {"_id": 0}).to_list(10000)
        headers = ["ID", "Kategoria", "Përshkrimi", "Shuma", "Valuta", "Metoda", "Data"]
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        for row, item in enumerate(data, 1):
            worksheet.write(row, 0, item.get("inflow_id", ""))
            worksheet.write(row, 1, item.get("kategoria", ""))
            worksheet.write(row, 2, item.get("pershkrimi", ""))
            worksheet.write(row, 3, item.get("shuma", 0))
            worksheet.write(row, 4, item.get("valuta", ""))
            worksheet.write(row, 5, item.get("metoda_pageses", ""))
            worksheet.write(row, 6, item.get("data", ""))
    
    elif type == "outflows":
        data = await db.outflows.find({}, {"_id": 0}).to_list(10000)
        headers = ["ID", "Kategoria", "Përshkrimi", "Shuma", "Valuta", "Data"]
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        for row, item in enumerate(data, 1):
            worksheet.write(row, 0, item.get("outflow_id", ""))
            worksheet.write(row, 1, item.get("kategoria", ""))
            worksheet.write(row, 2, item.get("pershkrimi", ""))
            worksheet.write(row, 3, item.get("shuma", 0))
            worksheet.write(row, 4, item.get("valuta", ""))
            worksheet.write(row, 5, item.get("data", ""))
    
    elif type == "patients":
        data = await db.patients.find({}, {"_id": 0}).to_list(10000)
        headers = ["ID", "Emri", "Mbiemri", "Telefon", "Email", "Adresa"]
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        for row, item in enumerate(data, 1):
            worksheet.write(row, 0, item.get("patient_id", ""))
            worksheet.write(row, 1, item.get("emri", ""))
            worksheet.write(row, 2, item.get("mbiemri", ""))
            worksheet.write(row, 3, item.get("telefon", ""))
            worksheet.write(row, 4, item.get("email", ""))
            worksheet.write(row, 5, item.get("adresa", ""))
    
    elif type == "invoices":
        data = await db.invoices.find({}, {"_id": 0}).to_list(10000)
        headers = ["ID", "Pacienti", "Shuma", "Valuta", "Përshkrimi", "Statusi", "Data"]
        for col, header in enumerate(headers):
            worksheet.write(0, col, header, header_format)
        
        for row, item in enumerate(data, 1):
            worksheet.write(row, 0, item.get("invoice_id", ""))
            worksheet.write(row, 1, item.get("patient_name", ""))
            worksheet.write(row, 2, item.get("shuma", 0))
            worksheet.write(row, 3, item.get("valuta", ""))
            worksheet.write(row, 4, item.get("pershkrimi", ""))
            worksheet.write(row, 5, item.get("statusi", ""))
            worksheet.write(row, 6, item.get("data", ""))
    
    workbook.close()
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={type}_export.xlsx"}
    )


@api_router.get("/export/pdf")
async def export_pdf(request: Request, type: str = "inflows", start_date: Optional[str] = None, end_date: Optional[str] = None):
    """Export data to PDF"""
    await require_admin(request)
    
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    
    output = BytesIO()
    doc = SimpleDocTemplate(output, pagesize=landscape(A4), rightMargin=30, leftMargin=30, topMargin=30, bottomMargin=30)
    elements = []
    styles = getSampleStyleSheet()
    
    # Title style
    title_style = ParagraphStyle('Title', parent=styles['Heading1'], fontSize=18, textColor=colors.HexColor('#0284c7'), spaceAfter=20)
    
    # Logo and header
    logo_url = "https://i.ibb.co/G3Bkww3q/63-C124-A8-2-AE7-4-F0-A-BB53-C2-E63-E1954-E0.png"
    
    if type == "inflows":
        elements.append(Paragraph("M-Dental - Raporti i Hyrjeve", title_style))
        data = await db.inflows.find({}, {"_id": 0}).to_list(10000)
        headers = ["Data", "Kategoria", "Përshkrimi", "Shuma", "Valuta", "Metoda"]
        table_data = [headers]
        total_mkd = 0
        total_eur = 0
        
        for item in data:
            row = [
                item.get("data", "")[:10] if item.get("data") else "",
                item.get("kategoria", ""),
                item.get("pershkrimi", "")[:40],
                f"{item.get('shuma', 0):,.2f}",
                item.get("valuta", ""),
                item.get("metoda_pageses", "")
            ]
            table_data.append(row)
            if item.get("valuta") == "MKD":
                total_mkd += item.get("shuma", 0)
            else:
                total_eur += item.get("shuma", 0)
        
        # Add totals
        table_data.append(["", "", "TOTAL MKD:", f"{total_mkd:,.2f}", "MKD", ""])
        if total_eur > 0:
            table_data.append(["", "", "TOTAL EUR:", f"{total_eur:,.2f}", "EUR", ""])
    
    elif type == "outflows":
        elements.append(Paragraph("M-Dental - Raporti i Daljeve", title_style))
        data = await db.outflows.find({}, {"_id": 0}).to_list(10000)
        headers = ["Data", "Kategoria", "Përshkrimi", "Shuma", "Valuta"]
        table_data = [headers]
        total_mkd = 0
        total_eur = 0
        
        for item in data:
            row = [
                item.get("data", "")[:10] if item.get("data") else "",
                item.get("kategoria", ""),
                item.get("pershkrimi", "")[:40],
                f"{item.get('shuma', 0):,.2f}",
                item.get("valuta", "")
            ]
            table_data.append(row)
            if item.get("valuta") == "MKD":
                total_mkd += item.get("shuma", 0)
            else:
                total_eur += item.get("shuma", 0)
        
        table_data.append(["", "", "TOTAL MKD:", f"{total_mkd:,.2f}", "MKD"])
        if total_eur > 0:
            table_data.append(["", "", "TOTAL EUR:", f"{total_eur:,.2f}", "EUR"])
    
    elif type == "patients":
        elements.append(Paragraph("M-Dental - Lista e Pacientëve", title_style))
        data = await db.patients.find({}, {"_id": 0}).to_list(10000)
        headers = ["Emri", "Mbiemri", "Telefon", "Email", "Adresa"]
        table_data = [headers]
        
        for item in data:
            row = [
                item.get("emri", ""),
                item.get("mbiemri", ""),
                item.get("telefon", ""),
                item.get("email", "")[:30],
                item.get("adresa", "")[:30]
            ]
            table_data.append(row)
    
    elif type == "invoices":
        elements.append(Paragraph("M-Dental - Lista e Faturave", title_style))
        data = await db.invoices.find({}, {"_id": 0}).to_list(10000)
        headers = ["Nr. Faturës", "Pacienti", "Shuma", "Valuta", "Statusi", "Data"]
        table_data = [headers]
        
        for item in data:
            row = [
                item.get("invoice_number", item.get("invoice_id", "")[:8]),
                item.get("patient_name", ""),
                f"{item.get('shuma', item.get('total_amount', 0)):,.2f}",
                item.get("valuta", item.get("currency", "")),
                item.get("statusi", item.get("status", "")),
                item.get("data", item.get("issue_date", ""))[:10] if item.get("data") or item.get("issue_date") else ""
            ]
            table_data.append(row)
    else:
        raise HTTPException(status_code=400, detail="Lloji i pavlefshëm i eksportit")
    
    # Create table with styling
    table = Table(table_data, repeatRows=1)
    table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0284c7')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.white),
        ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
        ('ALIGN', (3, 1), (3, -1), 'RIGHT'),  # Align amounts to right
    ]))
    
    elements.append(table)
    
    # Add date footer
    elements.append(Spacer(1, 20))
    date_style = ParagraphStyle('Date', parent=styles['Normal'], fontSize=8, textColor=colors.grey)
    elements.append(Paragraph(f"Gjeneruar më: {datetime.now().strftime('%d/%m/%Y %H:%M')}", date_style))
    
    doc.build(elements)
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={type}_export.pdf"}
    )


# ==================== APPOINTMENTS ====================

async def send_appointment_email(patient_email: str, patient_name: str, data_termini: str, ora: str, arsyeja: str) -> bool:
    """Send appointment notification email to patient using SendGrid"""
    if not patient_email or not SENDGRID_API_KEY:
        logger.warning("Cannot send email: missing email or API key")
        return False
    
    html_content = f"""<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
    .header {{ background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
    .content {{ 
      background: #ffffff;
      padding: 30px; 
      border: 1px solid #e5e7eb;
    }}
    .appointment-box {{ background: #f8fafc; border-left: 4px solid #2563eb; padding: 20px; margin: 20px 0; border-radius: 5px; }}
    .detail-row {{ display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }}
    .detail-label {{ font-weight: bold; width: 140px; color: #64748b; }}
    .detail-value {{ color: #1e293b; }}
    .footer {{ background: #f8fafc; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none; }}
    .button {{ background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }}
    .warning-box {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px; }}
    .info-box {{ background: #e0f2fe; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 5px; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div style="text-align: center;">
        <div style="width: 150px; height: 150px; margin: 0 auto 20px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="text-align: center;">
            <div style="font-size: 48px; font-weight: bold; color: #2563eb; line-height: 1; margin-bottom: 5px;">🦷</div>
            <div style="font-size: 24px; font-weight: bold; color: #1e293b; line-height: 1;">M-DENTAL</div>
            <div style="font-size: 12px; color: #0284c7; text-transform: uppercase; letter-spacing: 2px;">TERMINÉ</div>
          </div>
        </div>
      </div>
      <h1 style="margin: 0;">M-Dental</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">Klinikë Dentare Profesionale</p>
    </div>
    
    <div class="content">
      <h2 style="color: #1e293b; margin-top: 0;">Konfirmim i Terminit</h2>
      
      <p>I/E nderuar/e <strong>{patient_name}</strong>,</p>
      
      <p>Termini juaj është regjistruar me sukses në sistemin tonë. Ju lutemi gjeni detajet më poshtë:</p>
      
      <div class="appointment-box">
        <h3 style="margin-top: 0; color: #2563eb;">Detajet e Terminit</h3>
        
        <div class="detail-row">
          <span class="detail-label">📅 Data:</span>
          <span class="detail-value">{data_termini}</span>
        </div>
        
        <div class="detail-row">
          <span class="detail-label">🕐 Ora:</span>
          <span class="detail-value">{ora}</span>
        </div>
        
        <div class="detail-row" style="border-bottom: none;">
          <span class="detail-label">🦷 Shërbimi:</span>
          <span class="detail-value">{arsyeja}</span>
        </div>
      </div>
      
      <div class="warning-box">
        <strong>⚠️ Të rëndësishme:</strong>
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>Ju lutemi mbërrini 10 minuta para orarit të caktuar</li>
          <li>Nëse keni pyetje, na kontaktoni në kohë</li>
          <li>Për anullim ose ndryshim, na njoftoni të paktën 24 orë përpara</li>
        </ul>
      </div>

      <div class="info-box">
        <strong>📧 Për pyetje ose ndryshime:</strong>
        <p style="margin: 10px 0 5px 0;">Na kontaktoni në:</p>
        <ul style="margin: 5px 0; padding-left: 20px;">
          <li>📧 <a href="mailto:staffmdental@gmail.com" style="color: #2563eb;">staffmdental@gmail.com</a></li>
          <li>📞 <a href="tel:+38970666254" style="color: #2563eb;">+389 70 666 254</a></li>
        </ul>
      </div>
    </div>
    
    <div class="footer">
      <p style="margin: 0; color: #64748b; font-size: 14px;">Faleminderit që zgjodhët M-Dental!</p>
      <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 12px;">Klinikë Dentare Profesionale</p>
      <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
        <p style="margin: 5px 0; color: #64748b; font-size: 12px;">
          📧 <a href="mailto:staffmdental@gmail.com" style="color: #2563eb; text-decoration: none;">staffmdental@gmail.com</a>
        </p>
        <p style="margin: 5px 0; color: #64748b; font-size: 12px;">
          📞 <a href="tel:+38970666254" style="color: #2563eb; text-decoration: none;">+389 70 666 254</a>
        </p>
      </div>
    </div>
  </div>
</body>
</html>"""
    
    try:
        message = Mail(
            from_email=Email(SENDER_EMAIL, "M-Dental"),
            to_emails=To(patient_email),
            subject=f"M-Dental: Termini juaj - {data_termini} ora {ora}",
            html_content=Content("text/html", html_content)
        )
        
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = await asyncio.to_thread(sg.send, message)
        logger.info(f"Email sent to {patient_email}, status: {response.status_code}")
        return response.status_code in [200, 201, 202]
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return False

@api_router.get("/appointments", response_model=List[Dict[str, Any]])
async def get_appointments(request: Request, patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Get all appointments"""
    await get_current_user(request)
    
    query = {}
    if patient_id:
        query["patient_id"] = patient_id
    
    appointments = await db.appointments.find(query, {"_id": 0}).sort("data_termini", -1).to_list(1000)
    return appointments

@api_router.post("/appointments", response_model=Dict[str, Any])
async def create_appointment(data: AppointmentCreate, request: Request) -> Dict[str, Any]:
    """Create new appointment and send email notification"""
    user = await get_current_user(request)
    
    # Get patient info
    patient = await db.patients.find_one({"patient_id": data.patient_id}, {"_id": 0})
    if not patient:
        raise HTTPException(status_code=404, detail="Pacienti nuk u gjet")
    
    patient_name = f"{patient['emri']} {patient['mbiemri']}"
    patient_email = patient.get("email")
    
    appointment = Appointment(
        patient_id=data.patient_id,
        patient_name=patient_name,
        patient_email=patient_email,
        data_termini=data.data_termini,
        ora=data.ora,
        arsyeja=data.arsyeja,
        shenimet=data.shenimet,
        created_by=user["user_id"]
    )
    
    appointment_dict = appointment.model_dump()
    appointment_dict["created_at"] = appointment_dict["created_at"].isoformat()
    
    await db.appointments.insert_one(appointment_dict.copy())
    appointment_dict.pop("_id", None)
    
    await log_activity(user["user_id"], user["name"], "KRIJOI", "appointment", appointment.appointment_id, f"Termin: {patient_name} - {data.data_termini}")
    
    # Send email if requested and patient has email
    email_sent = False
    if data.send_email:
        if not patient_email:
            raise HTTPException(status_code=400, detail="Pacienti nuk ka email të regjistruar për njoftim")
        if not SENDGRID_API_KEY:
            raise HTTPException(status_code=500, detail="SENDGRID_API_KEY mungon në server")
        email_sent = await send_appointment_email(patient_email, patient_name, data.data_termini, data.ora, data.arsyeja)
    
    appointment_dict["email_sent"] = email_sent
    return appointment_dict

@api_router.put("/appointments/{appointment_id}")
async def update_appointment(appointment_id: str, data: AppointmentCreate, request: Request) -> Dict[str, str]:
    """Update appointment"""
    user = await get_current_user(request)
    
    update_data = {
        "data_termini": data.data_termini,
        "ora": data.ora,
        "arsyeja": data.arsyeja,
        "shenimet": data.shenimet
    }
    
    result = await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": update_data}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Termini nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "PËRDITËSOI", "appointment", appointment_id)
    
    return {"message": "Termini u përditësua"}

@api_router.delete("/appointments/{appointment_id}")
async def delete_appointment(appointment_id: str, request: Request) -> Dict[str, str]:
    """Delete appointment"""
    user = await get_current_user(request)
    
    result = await db.appointments.delete_one({"appointment_id": appointment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Termini nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "FSHIU", "appointment", appointment_id)
    
    return {"message": "Termini u fshi"}

@api_router.put("/appointments/{appointment_id}/status")
async def update_appointment_status(appointment_id: str, statusi: str, request: Request) -> Dict[str, str]:
    """Update appointment status"""
    user = await get_current_user(request)
    
    if statusi not in ["scheduled", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Statusi i pavlefshëm")
    
    result = await db.appointments.update_one(
        {"appointment_id": appointment_id},
        {"$set": {"statusi": statusi}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Termini nuk u gjet")
    
    await log_activity(user["user_id"], user["name"], "PËRDITËSOI", "appointment", appointment_id, f"Statusi: {statusi}")
    
    return {"message": "Statusi u përditësua"}

# ==================== INVOICE PRINT DATA ====================

@api_router.get("/invoices/{invoice_id}/print")
async def get_invoice_print_data(invoice_id: str, request: Request) -> Dict[str, Any]:
    """Get invoice data formatted for printing"""
    await get_current_user(request)
    
    invoice = await db.invoices.find_one({"invoice_id": invoice_id}, {"_id": 0})
    if not invoice:
        raise HTTPException(status_code=404, detail="Fatura nuk u gjet")
    
    # Get patient details
    patient = await db.patients.find_one({"patient_id": invoice["patient_id"]}, {"_id": 0})
    
    # Get exchange rate
    rate_doc = await db.exchange_rates.find_one({}, {"_id": 0}, sort=[("updated_at", -1)])
    exchange_rate = rate_doc["eur_to_mkd"] if rate_doc else 61.5
    
    return {
        "invoice": invoice,
        "patient": patient,
        "exchange_rate": exchange_rate,
        "clinic": {
            "name": "M-Dental",
            "address": "Adresa e Klinikës",
            "phone": "+389 XX XXX XXX",
            "email": "info@m-dental.com"
        }
    }

# Include router BEFORE middleware
app.include_router(api_router)

# CORS configuration - After router
default_origins = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3003,http://127.0.0.1:3003,http://localhost:5173,http://127.0.0.1:5173"
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', default_origins).split(','),
    allow_origin_regex=os.environ.get('CORS_ORIGIN_REGEX', r"https?://localhost(:\d+)?"),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global lockdown middleware (returns 503 for non-auth routes when LOCKDOWN_MODE=true)
@app.middleware("http")
async def lockdown_middleware(request: Request, call_next):
    if LOCKDOWN_MODE:
        path = request.url.path
        if path.startswith("/api") and path not in LOCKDOWN_ALLOWED_PATHS:
            return Response(content="Aplikacioni është në mirëmbajtje", status_code=503)
    return await call_next(request)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
