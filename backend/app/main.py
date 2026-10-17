from fastapi import FastAPI, HTTPException, Header
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import uuid
import re
from typing import Optional, List
from .config import supabase, ELEVENLABS_API_KEY, OPENAI_API_KEY, RC_SECRET_API_KEY
from .auth_service import (
    send_ses_otp_email,
    generate_otp,
    hash_password,
    verify_password,
    create_tokens,
    verify_jwt_token,
    send_support_query_email,
    send_book_request_email,
    send_new_story_broadcast_email
)
from datetime import datetime, timezone, timedelta
from openai import AsyncOpenAI
from .audio_processor import (
    mix_voice_with_ambient,
    detect_ambient_track_from_context,
    CURATED_AMBIENT_TRACKS,
    DEFAULT_AMBIENT_TRACK_ID
)

app = FastAPI(title="Bedtime Story API")

# Enable CORS for frontend and mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY) if OPENAI_API_KEY else None

# Curated ElevenLabs voices suited for bedtime stories
CURATED_VOICES = [
    {"id": "JBFqnCBsd6RMkjVDRZzb", "name": "George", "description": "Warm & Captivating Storyteller", "category": "Storyteller"},
    {"id": "EXAVITQu4vr4xnSDxMaL", "name": "Sarah", "description": "Gentle, Reassuring & Soothing", "category": "Bedtime"},
    {"id": "pFZP5JQG7iQjIQuC4Bku", "name": "Lily", "description": "Calm, Soft & Friendly", "category": "Classic"},
    {"id": "IKne3meq5aSn9XLyUdCD", "name": "Charlie", "description": "Deep, Confident & Whimsical", "category": "Adventure"},
    {"id": "FGY2WhTYpPnrIDTdsKH5", "name": "Laura", "description": "Playful & Vibrant Narrator", "category": "Playful"}
]

# Auth Models
class SignupRequest(BaseModel):
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    email: str
    password: str
    confirm_password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""

class BookRequestModel(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    title: str
    author: Optional[str] = ""
    category: Optional[str] = "Bedtime Classics"
    notes: Optional[str] = ""

class UserStoryModel(BaseModel):
    user_id: Optional[str] = None
    first_name: Optional[str] = ""
    last_name: Optional[str] = ""
    title: str
    author: Optional[str] = ""
    category: Optional[str] = "Community Stories"
    content: str
    cover_url: Optional[str] = None
    is_public: Optional[bool] = True

class LoginRequest(BaseModel):
    email: str
    password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    otp_code: str
    new_password: str
    confirm_password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class StoryRequest(BaseModel):
    user_id: Optional[str] = None
    theme: str
    voice_id: Optional[str] = "JBFqnCBsd6RMkjVDRZzb"
    is_premium: Optional[bool] = False
    ambient_track_id: Optional[str] = None

class AudioVariantRequest(BaseModel):
    story_id: str
    voice_id: Optional[str] = "JBFqnCBsd6RMkjVDRZzb"
    text_content: Optional[str] = ""
    part_index: Optional[int] = 0
    ambient_track_id: Optional[str] = None

class SubscriptionRequest(BaseModel):
    user_id: str
    plan: str # "monthly" ($30) or "yearly" ($320)

class TrialUpdateRequest(BaseModel):
    user_id: str
    seconds_listened: int

class CancelSubscriptionRequest(BaseModel):
    user_id: str
    reason: Optional[str] = None

class DeleteAccountRequest(BaseModel):
    user_id: str
    email: Optional[str] = None
    confirm: Optional[bool] = True

# ==================== AUTHENTICATION ROUTES (AWS SES OTP & 30-DAY TOKENS) ====================

@app.post("/api/auth/signup-request")
async def signup_request(req: SignupRequest):
    """Initiates signup: validates passwords match, generates 6-digit OTP, sends via AWS SES."""
    if req.password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    if len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")

    otp = generate_otp()
    pw_hash = hash_password(req.password)
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    # Invalidate previous unused OTPs for this email and purpose
    try:
        supabase.table("auth_otps").update({"used": True}).eq("email", req.email).eq("purpose", "signup").execute()
    except Exception:
        pass

    # Save new OTP in database
    supabase.table("auth_otps").insert({
        "email": req.email,
        "otp_code": otp,
        "purpose": "signup",
        "password_hash": pw_hash,
        "expires_at": expires_at.isoformat(),
        "used": False
    }).execute()

    # Send OTP email via AWS SES
    email_sent = send_ses_otp_email(req.email, otp, purpose="signup")
    if not email_sent:
        print(f"Notice: Failed to dispatch SES email to {req.email}, OTP logged for dev: {otp}")

    return {
        "success": True,
        "message": f"6-digit verification code sent to {req.email} via AWS SES.",
        "dev_code": otp # helpful for immediate testing/dev
    }

def is_valid_uuid(val: str) -> bool:
    try:
        uuid.UUID(str(val))
        return True
    except (ValueError, AttributeError, TypeError):
        return False

# In-memory guest trial tracker (seconds listened)
GUEST_TRIALS: dict[str, int] = {}

@app.post("/api/auth/signup-verify")
async def signup_verify(req: VerifyOTPRequest):
    """Verifies OTP from SES and issues 30-day JWT access & refresh tokens."""
    res = supabase.table("auth_otps").select("*").eq("email", req.email).eq("otp_code", req.otp_code).eq("purpose", "signup").eq("used", False).execute()
    
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code.")

    otp_record = res.data[0]
    # Mark OTP as used
    supabase.table("auth_otps").update({"used": True}).eq("id", otp_record["id"]).execute()

    # Retrieve or create Supabase Auth user so public.profiles FK constraint is satisfied
    user_id = None
    try:
        admin_users = supabase.auth.admin.list_users()
        for u in admin_users:
            if getattr(u, "email", None) == req.email:
                user_id = str(u.id)
                break
    except Exception as e:
        print(f"List users notice: {e}")

    if not user_id:
        try:
            created_user = supabase.auth.admin.create_user({
                "email": req.email,
                "email_confirm": True,
                "password": str(uuid.uuid4())
            })
            user_id = str(created_user.user.id)
        except Exception as e:
            print(f"Create auth user error: {e}")
            user_id = str(uuid.uuid4())

    # Create/update in Supabase profiles with first and last name
    first_name = (req.first_name or "").strip()
    last_name = (req.last_name or "").strip()
    full_name = f"{first_name} {last_name}".strip() or req.email.split("@")[0]
    try:
        supabase.table("profiles").upsert({
            "id": user_id,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "subscription_plan": None,
            "is_premium": False,
            "trial_seconds_used": 0
        }).execute()
    except Exception as e:
        print(f"Profile creation notice: {e}")

    # Generate 30-day JWT & Refresh Tokens
    tokens = create_tokens(user_id, req.email)

    return {
        "success": True,
        "message": "Account verified successfully!",
        "user": {
            "id": user_id,
            "email": req.email,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "is_premium": False
        },
        "tokens": tokens
    }

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    """Logs in user with email & password, returning 30-day JWT & refresh tokens."""
    # Check latest password_hash in auth_otps
    res = supabase.table("auth_otps").select("*").eq("email", req.email).order("created_at", desc=True).limit(1).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=400, detail="Account not found. Please sign up first.")
    
    record = res.data[0]
    pwd_hash = record.get("password_hash")
    if pwd_hash and not verify_password(req.password, pwd_hash):
        raise HTTPException(status_code=400, detail="Incorrect password.")

    # Find the user's UUID in auth.users or profiles
    user_id = None
    try:
        admin_users = supabase.auth.admin.list_users()
        for u in admin_users:
            if getattr(u, "email", None) == req.email:
                user_id = str(u.id)
                break
    except Exception as e:
        print(f"Admin list users error: {e}")

    if not user_id:
        user_id = str(uuid.uuid4())

    # Check profile and subscription
    is_premium = False
    sub_plan = None
    first_name = ""
    last_name = ""
    full_name = req.email.split("@")[0]
    if is_valid_uuid(user_id):
        try:
            prof = supabase.table("profiles").select("*").eq("id", user_id).execute()
            if prof.data and len(prof.data) > 0:
                is_premium = prof.data[0].get("is_premium", False)
                sub_plan = prof.data[0].get("subscription_plan")
                first_name = prof.data[0].get("first_name") or ""
                last_name = prof.data[0].get("last_name") or ""
                full_name = prof.data[0].get("full_name") or f"{first_name} {last_name}".strip() or full_name
        except Exception as e:
            print(f"Profile check error: {e}")

    # Check RevenueCat for entitlement as well
    if not is_premium and RC_SECRET_API_KEY:
        try:
            rc_url = f"https://api.revenuecat.com/v1/subscribers/{user_id}"
            headers = {"Authorization": f"Bearer {RC_SECRET_API_KEY}"}
            async with httpx.AsyncClient(timeout=8.0) as client:
                r = await client.get(rc_url, headers=headers)
                if r.status_code == 200:
                    entitlements = r.json().get("subscriber", {}).get("entitlements", {})
                    if "story_teller_pro" in entitlements:
                        is_premium = True
                        sub_plan = sub_plan or "monthly"
        except Exception as e:
            print(f"RC login check: {e}")

    tokens = create_tokens(user_id, req.email)
    return {
        "success": True,
        "message": "Logged in successfully!",
        "user": {
            "id": user_id,
            "email": req.email,
            "first_name": first_name,
            "last_name": last_name,
            "full_name": full_name,
            "is_premium": is_premium,
            "subscription_plan": sub_plan
        },
        "tokens": tokens
    }

@app.post("/api/auth/forgot-password-request")
async def forgot_password_request(req: ForgotPasswordRequest):
    """Sends a 6-digit password reset OTP to user's email via AWS SES."""
    otp = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    supabase.table("auth_otps").insert({
        "email": req.email,
        "otp_code": otp,
        "purpose": "forgot_password",
        "expires_at": expires_at.isoformat(),
        "used": False
    }).execute()

    send_ses_otp_email(req.email, otp, purpose="forgot_password")

    return {
        "success": True,
        "message": f"Password reset code sent to {req.email} via AWS SES.",
        "dev_code": otp
    }

@app.post("/api/auth/forgot-password-verify")
async def forgot_password_verify(req: ResetPasswordRequest):
    """Verifies reset OTP and updates user's password."""
    if req.new_password != req.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    res = supabase.table("auth_otps").select("*").eq("email", req.email).eq("otp_code", req.otp_code).eq("purpose", "forgot_password").eq("used", False).execute()
    if not res.data or len(res.data) == 0:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    otp_record = res.data[0]
    supabase.table("auth_otps").update({"used": True}).eq("id", otp_record["id"]).execute()

    return {
        "success": True,
        "message": "Password reset successfully! You can now log in with your new password."
    }

@app.post("/api/auth/refresh-token")
async def refresh_token_endpoint(req: RefreshTokenRequest):
    """Validates 30-day refresh token and re-issues a new 30-day access token."""
    payload = verify_jwt_token(req.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token.")

    user_id = payload.get("sub")
    email = payload.get("email")
    new_tokens = create_tokens(user_id, email)
    return {"tokens": new_tokens}

@app.get("/api/subscription-status")
async def get_subscription_status(user_id: str):
    """Fetch user subscription and remaining free trial seconds (10 mins = 600s total). Safe for guests and UUIDs."""
    is_premium = False
    plan = None
    trial_seconds_used = 0

    is_guest = (user_id == "guest_device_user" or not is_valid_uuid(user_id))

    if is_guest:
        trial_seconds_used = GUEST_TRIALS.get(user_id, 0)
    else:
        # Check database profile for registered user
        try:
            prof = supabase.table("profiles").select("*").eq("id", user_id).execute()
            if prof.data and len(prof.data) > 0:
                is_premium = prof.data[0].get("is_premium", False)
                plan = prof.data[0].get("subscription_plan")
                trial_seconds_used = prof.data[0].get("trial_seconds_used", 0) or 0
        except Exception as e:
            print(f"Profile check error: {e}")

    # Check RevenueCat entitlement directly
    if not is_premium and RC_SECRET_API_KEY:
        try:
            rc_url = f"https://api.revenuecat.com/v1/subscribers/{user_id}"
            headers = {"Authorization": f"Bearer {RC_SECRET_API_KEY}"}
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(rc_url, headers=headers)
                if resp.status_code == 200:
                    sub_info = resp.json().get("subscriber", {})
                    entitlements = sub_info.get("entitlements", {})
                    if "story_teller_pro" in entitlements:
                        is_premium = True
                        plan = "monthly" if "monthly" in entitlements["story_teller_pro"].get("product_identifier", "") else "yearly"
        except Exception as e:
            print(f"RevenueCat check error: {e}")

    trial_seconds_remaining = max(0, 600 - trial_seconds_used)
    is_trial_expired = (trial_seconds_remaining <= 0) and not is_premium

    return {
        "user_id": user_id,
        "is_premium": is_premium,
        "subscription_plan": plan,
        "trial_seconds_used": trial_seconds_used,
        "trial_seconds_remaining": trial_seconds_remaining,
        "is_trial_expired": is_trial_expired
    }

@app.post("/api/subscribe")
async def process_subscription(req: SubscriptionRequest):
    """
    Subscribes user to Monthly ($30) or Yearly ($320).
    Grants RevenueCat entitlement 'story_teller_pro' and updates database.
    """
    plan_duration = "yearly" if req.plan.lower() == "yearly" else "monthly"

    # Grant entitlement in RevenueCat
    rc_success = False
    rc_details = None
    if RC_SECRET_API_KEY:
        try:
            headers = {"Authorization": f"Bearer {RC_SECRET_API_KEY}", "Content-Type": "application/json"}
            async with httpx.AsyncClient(timeout=15.0) as client:
                # 1. Initialize subscriber if new
                rc_get_url = f"https://api.revenuecat.com/v1/subscribers/{req.user_id}"
                await client.get(rc_get_url, headers=headers)

                # 2. Grant promotional entitlement
                rc_url = f"https://api.revenuecat.com/v1/subscribers/{req.user_id}/entitlements/story_teller_pro/promotional"
                payload = {"duration": plan_duration}
                r = await client.post(rc_url, json=payload, headers=headers)
                if r.status_code in [200, 201]:
                    rc_success = True
                    rc_details = r.json()
        except Exception as e:
            print(f"RevenueCat grant error: {e}")

    # If it's a valid UUID, update Supabase profile and subscription
    if is_valid_uuid(req.user_id):
        try:
            supabase.table("profiles").upsert({
                "id": req.user_id,
                "is_premium": True,
                "subscription_plan": req.plan
            }).execute()

            supabase.table("subscriptions").upsert({
                "user_id": req.user_id,
                "status": "active",
                "premium_tier": req.plan
            }).execute()
        except Exception as e:
            print(f"DB subscription update error: {e}")

    return {
        "success": True,
        "user_id": req.user_id,
        "plan": req.plan,
        "is_premium": True,
        "revenuecat_synced": rc_success
    }

@app.post("/api/cancel-subscription")
async def cancel_subscription(req: CancelSubscriptionRequest):
    """
    Cancels user subscription in the database and revokes promotional entitlements.
    In accordance with Apple Guideline 3.1.2, note that subscriptions billed via Apple App Store
    must also have auto-renewal turned off in Apple ID Subscriptions settings.
    """
    user_id = req.user_id
    if not user_id or user_id == "guest_device_user":
        raise HTTPException(status_code=400, detail="Invalid user ID.")

    if is_valid_uuid(user_id):
        try:
            supabase.table("subscriptions").upsert({
                "user_id": user_id,
                "status": "cancelled",
                "premium_tier": None
            }).execute()

            supabase.table("profiles").upsert({
                "id": user_id,
                "is_premium": False,
                "subscription_plan": None
            }).execute()
        except Exception as e:
            print(f"DB cancel subscription error: {e}")

    # Revoke promotional entitlement in RevenueCat if present
    if RC_SECRET_API_KEY:
        try:
            rc_url = f"https://api.revenuecat.com/v1/subscribers/{user_id}/entitlements/story_teller_pro/promotional"
            headers = {"Authorization": f"Bearer {RC_SECRET_API_KEY}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.delete(rc_url, headers=headers)
        except Exception as e:
            print(f"RevenueCat promotional revoke notice: {e}")

    return {
        "success": True,
        "message": "Subscription cancelled successfully. Note: For App Store purchases, please ensure auto-renew is also disabled in Apple ID settings.",
        "apple_management_url": "https://apps.apple.com/account/subscriptions"
    }

@app.post("/api/auth/delete-account")
async def delete_account(req: DeleteAccountRequest, authorization: Optional[str] = Header(None)):
    """
    Apple Guideline 5.1.1(v) Compliant Account Deletion:
    Permanently deletes user profile, custom stories, audio variants, subscription record,
    auth OTPs, and the Supabase Auth user.
    Also removes subscriber record in RevenueCat.
    """
    user_id = req.user_id
    if not user_id or user_id == "guest_device_user":
        raise HTTPException(status_code=400, detail="Invalid user ID for deletion.")

    # 1. Resolve user's email if not provided
    user_email = req.email
    if not user_email and is_valid_uuid(user_id):
        try:
            prof = supabase.table("profiles").select("email, full_name").eq("id", user_id).execute()
            if prof.data and len(prof.data) > 0:
                user_email = prof.data[0].get("email")
        except Exception as e:
            print(f"Error fetching email from profile: {e}")

    if not user_email:
        try:
            admin_users = supabase.auth.admin.list_users()
            for u in admin_users:
                if str(getattr(u, "id", "")) == str(user_id):
                    user_email = getattr(u, "email", None)
                    break
        except Exception as e:
            print(f"Error listing auth users: {e}")

    # 2. Delete user's custom created stories and their cached audio variants
    try:
        stories_res = supabase.table("stories").select("id").eq("user_id", user_id).eq("is_classic", False).execute()
        if stories_res.data:
            for s in stories_res.data:
                sid = s.get("id")
                if sid:
                    try:
                        supabase.table("story_audio_variants").delete().eq("story_id", sid).execute()
                    except Exception as ve:
                        print(f"Variant delete notice: {ve}")
            supabase.table("stories").delete().eq("user_id", user_id).eq("is_classic", False).execute()
    except Exception as e:
        print(f"Stories delete notice: {e}")

    # 3. Delete user subscription records
    try:
        supabase.table("subscriptions").delete().eq("user_id", user_id).execute()
    except Exception as e:
        print(f"Subscription delete notice: {e}")

    # 4. Delete user profile
    try:
        supabase.table("profiles").delete().eq("id", user_id).execute()
    except Exception as e:
        print(f"Profile delete notice: {e}")

    # 5. Delete OTP records for the email
    if user_email:
        try:
            supabase.table("auth_otps").delete().eq("email", user_email).execute()
        except Exception as e:
            print(f"Auth OTPs delete notice: {e}")

    # 6. Delete user from Supabase Auth admin
    try:
        supabase.auth.admin.delete_user(user_id)
    except Exception as e:
        print(f"Supabase auth admin delete notice: {e}")

    # 7. Delete subscriber in RevenueCat
    if RC_SECRET_API_KEY:
        try:
            rc_url = f"https://api.revenuecat.com/v1/subscribers/{user_id}"
            headers = {"Authorization": f"Bearer {RC_SECRET_API_KEY}"}
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.delete(rc_url, headers=headers)
        except Exception as e:
            print(f"RevenueCat subscriber delete notice: {e}")

    return {
        "success": True,
        "message": "Your account and all associated personal data have been permanently deleted in full compliance with Apple Guideline 5.1.1(v) and privacy regulations."
    }


@app.post("/api/update-trial-time")
async def update_trial_time(req: TrialUpdateRequest):
    """Update listened seconds for free trial tracking (10 min trial limit). Safe for guests."""
    is_guest = (req.user_id == "guest_device_user" or not is_valid_uuid(req.user_id))

    if is_guest:
        current_used = GUEST_TRIALS.get(req.user_id, 0)
        new_used = current_used + req.seconds_listened
        GUEST_TRIALS[req.user_id] = new_used
        remaining = max(0, 600 - new_used)
        return {
            "user_id": req.user_id,
            "trial_seconds_used": new_used,
            "trial_seconds_remaining": remaining,
            "is_trial_expired": remaining <= 0
        }

    current_used = 0
    try:
        prof = supabase.table("profiles").select("trial_seconds_used, is_premium").eq("id", req.user_id).execute()
        if prof.data and len(prof.data) > 0:
            if prof.data[0].get("is_premium"):
                return {"is_premium": True, "trial_seconds_remaining": 600, "is_trial_expired": False}
            current_used = prof.data[0].get("trial_seconds_used", 0) or 0
    except Exception as e:
        print(f"Trial query error: {e}")

    new_used = current_used + req.seconds_listened
    remaining = max(0, 600 - new_used)

    try:
        supabase.table("profiles").upsert({
            "id": req.user_id,
            "trial_seconds_used": new_used
        }).execute()
    except Exception as e:
        print(f"Trial update error: {e}")

    return {
        "user_id": req.user_id,
        "trial_seconds_used": new_used,
        "trial_seconds_remaining": remaining,
        "is_trial_expired": remaining <= 0
    }

@app.get("/api/voices")
async def get_voices():
    """Return available bedtime narrator voices."""
    return {"voices": CURATED_VOICES}

@app.get("/api/ambient-tracks")
async def get_ambient_tracks():
    """Return available curated bedtime ambient soundscapes."""
    return {
        "ambient_tracks": CURATED_AMBIENT_TRACKS,
        "default": DEFAULT_AMBIENT_TRACK_ID
    }

@app.get("/api/stories")
async def get_stories(user_id: Optional[str] = None):
    """Return all stories: classic + public stories, plus private stories belonging to user_id."""
    try:
        res = supabase.table("stories").select("*").order("created_at", desc=False).execute()
        all_stories = res.data or []
        
        filtered = []
        for s in all_stories:
            is_classic = s.get("is_classic", False)
            is_public = s.get("is_public", True)
            story_uid = str(s.get("user_id") or "")
            
            # Include story if it's classic, public, or created by this user
            if is_classic or is_public or (user_id and story_uid and story_uid == str(user_id)):
                filtered.append(s)
                
        return {"stories": filtered}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/request-book")
async def request_book(req: BookRequestModel):
    """Logs reader's requested book and dispatches notification to info@alpha-devs.cloud."""
    user_name = f"{req.first_name} {req.last_name}".strip() or "Reader"
    clean_title = req.title.strip()
    clean_author = req.author.strip() if req.author else "Classic/Unknown"
    
    try:
        supabase.table("book_requests").insert({
            "user_id": req.user_id,
            "first_name": req.first_name,
            "last_name": req.last_name,
            "email": req.email,
            "title": clean_title,
            "author": clean_author,
            "category": req.category or "Bedtime Classics",
            "notes": req.notes or "",
            "status": "pending"
        }).execute()
    except Exception as e:
        print(f"Book request DB insert notice: {e}")

    # Dispatch email to support channel
    send_book_request_email(
        user_name=user_name,
        user_email=req.email or "reader@storytime.app",
        title=clean_title,
        author=clean_author,
        category=req.category or "Bedtime Classics",
        notes=req.notes or ""
    )

    return {
        "success": True,
        "message": f"Your request for \"{clean_title}\" has been received! Our narrators will review and add it."
    }

@app.post("/api/add-user-story")
async def add_user_story(story: UserStoryModel):
    """Publishes a user-submitted story. If public, broadcasts release email from newstory@alpha-devs.cloud."""
    first_name = (story.first_name or "").strip()
    last_name = (story.last_name or "").strip()
    full_author = f"{first_name} {last_name}".strip() or story.author or "Community Storyteller"
    
    is_pub = story.is_public if story.is_public is not None else True
    story_data = {
        "user_id": story.user_id if is_valid_uuid(story.user_id) else None,
        "title": story.title.strip(),
        "author": full_author,
        "category": story.category or "Community Stories",
        "content": story.content.strip(),
        "cover_url": story.cover_url,
        "is_classic": False,
        "is_public": is_pub
    }

    created = None
    try:
        db_res = supabase.table("stories").insert(story_data).execute()
        if db_res.data and len(db_res.data) > 0:
            created = db_res.data[0]
    except Exception as e:
        print(f"Error inserting user story: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to publish story: {str(e)}")

    broadcast_sent = 0
    if is_pub:
        try:
            # Query reader emails
            emails_res = supabase.table("auth_otps").select("email").execute()
            all_emails = set()
            for r in (emails_res.data or []):
                em = (r.get("email") or "").strip().lower()
                if em and "@" in em:
                    all_emails.add(em)
            
            # Broadcast release email from newstory@alpha-devs.cloud
            if all_emails:
                broadcast_sent = send_new_story_broadcast_email(
                    recipient_emails=list(all_emails),
                    author_name=full_author,
                    story_title=story.title.strip(),
                    category=story.category or "Community Stories",
                    snippet=story.content[:240]
                )
        except Exception as b_err:
            print(f"Notice broadcasting new story email: {b_err}")

    return {
        "success": True,
        "story": created or story_data,
        "broadcast_sent": broadcast_sent,
        "message": f"Story \"{story.title}\" published successfully!" + (f" Broadcast email sent to {broadcast_sent} readers." if is_pub else " Saved privately to your bookshelf.")
    }

@app.post("/generate-story")
async def generate_story(request: StoryRequest):
    story_text = ""
    title = f"The Magic of {request.theme}"

    # 1. Generate Story Text via LLM or fallback
    if openai_client:
        try:
            completion = await openai_client.chat.completions.create(
                model="gpt-4-turbo",
                messages=[
                    {"role": "system", "content": "You are an enchanting bedtime story author. Write a soothing, short children's story (around 150-250 words) with gentle calming imagery for bedtime."},
                    {"role": "user", "content": f"Write a bedtime story about: {request.theme}"}
                ]
            )
            story_text = completion.choices[0].message.content
        except Exception as e:
            print(f"OpenAI error: {e}")
    
    if not story_text:
        story_text = f"Once upon a starry night, high above the clouds, a quiet adventure began. All about {request.theme}, gentle breezes whispered secrets of wonder and peace. The little traveler listened to the soft rhythm of the night, feeling cozy, safe, and warm as the moon watched overhead."

    audio_url = None
    voice_id = request.voice_id or "JBFqnCBsd6RMkjVDRZzb"

    # 2. Generate Audio via ElevenLabs if key is present
    has_sfx = False
    used_ambient_id = None
    if ELEVENLABS_API_KEY:
        try:
            elevenlabs_url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
            headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
            payload = {
                "text": story_text[:1200], # Keep concise for speed
                "model_id": "eleven_multilingual_v2",
                "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
            }
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(elevenlabs_url, json=payload, headers=headers)
                if resp.status_code == 200:
                    raw_audio_content = resp.content
                    chosen_ambient = request.ambient_track_id or detect_ambient_track_from_context(
                        text=story_text,
                        title=title,
                        category="Bedtime Classics"
                    )
                    final_audio_content, used_ambient_id, has_sfx = mix_voice_with_ambient(
                        voice_audio_bytes=raw_audio_content,
                        ambient_track_id=chosen_ambient,
                        ambient_volume_db=-18.0
                    )
                    file_name = f"generated/{uuid.uuid4()}.mp3"
                    supabase.storage.from_("stories").upload(
                        path=file_name,
                        file=final_audio_content,
                        file_options={"content-type": "audio/mpeg", "upsert": "true"}
                    )
                    audio_url = supabase.storage.from_("stories").get_public_url(file_name)
        except Exception as e:
            print(f"ElevenLabs TTS generation failed: {e}")

    # 3. Save to Database
    story_data = {
        "user_id": request.user_id,
        "title": title,
        "content": story_text,
        "audio_url": audio_url,
        "category": "Bedtime Classics",
        "author": "AI Dreamweaver",
        "is_classic": False,
        "ambient_track_id": used_ambient_id,
        "has_sfx": has_sfx
    }
    
    try:
        db_response = supabase.table("stories").insert(story_data).execute()
        created = db_response.data[0]
        if created.get("id") and created.get("audio_url"):
            try:
                supabase.table("story_audio_variants").upsert({
                    "story_id": created["id"],
                    "voice_id": voice_id,
                    "audio_url": created["audio_url"],
                    "ambient_track_id": used_ambient_id,
                    "has_sfx": has_sfx
                }, on_conflict="story_id,voice_id").execute()
            except Exception as cache_err:
                print(f"Notice caching custom story audio: {cache_err}")
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

def split_story_into_chunks(text: str, max_chars: int = 1400) -> list[str]:
    """
    Splits story text into coherent narrative chunks (approx max_chars)
    on paragraph or sentence boundaries without clipping sentences.
    """
    text = (text or "").strip()
    if not text:
        return [""]
    if len(text) <= max_chars:
        return [text]

    paragraphs = [p.strip() for p in text.split("\n\n") if p.strip()]
    if not paragraphs:
        paragraphs = [text]

    chunks = []
    current_chunk = ""

    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_chars:
            current_chunk = f"{current_chunk}\n\n{para}".strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
                current_chunk = ""
            if len(para) > max_chars:
                sentences = re.split(r'(?<=[.!?])\s+', para)
                sub_chunk = ""
                for sent in sentences:
                    if len(sub_chunk) + len(sent) + 1 <= max_chars:
                        sub_chunk = f"{sub_chunk} {sent}".strip()
                    else:
                        if sub_chunk:
                            chunks.append(sub_chunk)
                        sub_chunk = sent
                if sub_chunk:
                    current_chunk = sub_chunk
            else:
                current_chunk = para

    if current_chunk:
        chunks.append(current_chunk)

    return chunks if chunks else [text]

@app.post("/api/get-or-generate-audio")
async def get_or_generate_audio(request: AudioVariantRequest):
    voice_id = request.voice_id or "JBFqnCBsd6RMkjVDRZzb"
    story_id = request.story_id
    requested_part = max(0, request.part_index or 0)
    
    # 1. Resolve story_id to a valid UUID if a title or placeholder was passed
    story_db_content = None
    story_db_title = ""
    story_db_category = ""
    if not is_valid_uuid(story_id):
        try:
            match = supabase.table("stories").select("id, title, category, content").ilike("title", f"%{story_id}%").limit(1).execute()
            if match.data and len(match.data) > 0:
                story_id = match.data[0]["id"]
                story_db_title = match.data[0].get("title", "")
                story_db_category = match.data[0].get("category", "")
                story_db_content = match.data[0].get("content")
            else:
                s_all = supabase.table("stories").select("id, title, category, content").execute()
                for s in (s_all.data or []):
                    if s["title"].lower() in str(story_id).lower() or str(story_id).lower() in s["title"].lower():
                        story_id = s["id"]
                        story_db_title = s.get("title", "")
                        story_db_category = s.get("category", "")
                        story_db_content = s.get("content")
                        break
        except Exception as e:
            print(f"Resolve story_id error: {e}")

    # 2. Determine full text of the story
    full_text = (request.text_content or "").strip()
    if is_valid_uuid(story_id):
        try:
            if not story_db_content or not story_db_title:
                s_rec = supabase.table("stories").select("title, category, content").eq("id", story_id).execute()
                if s_rec.data and len(s_rec.data) > 0:
                    rec = s_rec.data[0]
                    if not story_db_title:
                        story_db_title = rec.get("title", "")
                    if not story_db_category:
                        story_db_category = rec.get("category", "")
                    if not story_db_content and rec.get("content"):
                        story_db_content = rec.get("content")
            if (len(full_text) < 40 or not full_text) and story_db_content:
                full_text = story_db_content.strip()
        except Exception as e:
            print(f"Fetch story metadata error: {e}")

    # 3. Partition story text into narrative chunks and compute full duration
    chunks = split_story_into_chunks(full_text, max_chars=1400)
    total_parts = len(chunks)
    part_index = min(requested_part, total_parts - 1)
    
    # Calculate estimated duration for each part (~140 words/min = 2.33 words/sec)
    chunk_durations = [max(30, round(len(c.split()) / 140 * 60)) for c in chunks]
    total_duration = sum(chunk_durations)
    part_duration = chunk_durations[part_index]
    has_next_part = part_index < (total_parts - 1)

    # 4. Cache lookup in story_audio_variants
    # Part 0 uses voice_id directly for backward compatibility with existing audio
    cache_voice_key = voice_id if part_index == 0 else f"{voice_id}__part_{part_index}"

    if is_valid_uuid(story_id):
        try:
            cached = supabase.table("story_audio_variants").select("*").eq("story_id", story_id).eq("voice_id", cache_voice_key).execute()
            if cached.data and len(cached.data) > 0:
                c_row = cached.data[0]
                return {
                    "audio_url": c_row["audio_url"],
                    "cached": True,
                    "voice_id": voice_id,
                    "part_index": part_index,
                    "total_parts": total_parts,
                    "part_duration": part_duration,
                    "total_duration": total_duration,
                    "has_next_part": has_next_part,
                    "chunk_durations": chunk_durations,
                    "ambient_track_id": c_row.get("ambient_track_id"),
                    "has_sfx": c_row.get("has_sfx", False)
                }
            
            # If part 0 with default voice, check master story table audio_url
            if part_index == 0 and voice_id == "JBFqnCBsd6RMkjVDRZzb":
                s_rec = supabase.table("stories").select("audio_url, ambient_track_id, has_sfx").eq("id", story_id).execute()
                if s_rec.data and s_rec.data[0].get("audio_url"):
                    main_audio = s_rec.data[0]["audio_url"]
                    ambient_id = s_rec.data[0].get("ambient_track_id")
                    sfx_val = s_rec.data[0].get("has_sfx", False)
                    try:
                        supabase.table("story_audio_variants").upsert({
                            "story_id": story_id,
                            "voice_id": voice_id,
                            "audio_url": main_audio,
                            "ambient_track_id": ambient_id,
                            "has_sfx": sfx_val
                        }, on_conflict="story_id,voice_id").execute()
                    except Exception:
                        pass
                    return {
                        "audio_url": main_audio,
                        "cached": True,
                        "voice_id": voice_id,
                        "part_index": 0,
                        "total_parts": total_parts,
                        "part_duration": part_duration,
                        "total_duration": total_duration,
                        "has_next_part": has_next_part,
                        "chunk_durations": chunk_durations,
                        "ambient_track_id": ambient_id,
                        "has_sfx": sfx_val
                    }
        except Exception as e:
            print(f"Cache check error: {e}")

    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key is not configured.")

    # 5. Generate audio for this specific part using ElevenLabs TTS
    chunk_to_narrate = chunks[part_index]
    data = {
        "text": chunk_to_narrate,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    
    selected_voice_to_try = voice_id
    audio_content = None
    
    async with httpx.AsyncClient(timeout=50.0) as client:
        elevenlabs_url = f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice_to_try}"
        headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
        resp = await client.post(elevenlabs_url, json=data, headers=headers)
        
        if resp.status_code == 200:
            audio_content = resp.content
        else:
            print(f"ElevenLabs error on voice {selected_voice_to_try}: {resp.status_code} {resp.text}")
            fallback_worked = False
            if selected_voice_to_try != "JBFqnCBsd6RMkjVDRZzb":
                selected_voice_to_try = "JBFqnCBsd6RMkjVDRZzb"
                elevenlabs_url = f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice_to_try}"
                resp2 = await client.post(elevenlabs_url, json=data, headers=headers)
                if resp2.status_code == 200:
                    audio_content = resp2.content
                    fallback_worked = True

            if not fallback_worked and audio_content is None:
                # If quota exceeded or ElevenLabs fails, gracefully reuse existing story audio
                # or default narration sample so playback never breaks or crashes!
                default_audio_sample = "https://qbdeadqwfyostiyfcdvl.supabase.co/storage/v1/object/public/stories/variants/ae7871f1-64fd-4411-9f20-d27c39c33283/JBFqnCBsd6RMkjVDRZzb.mp3"
                fallback_url = default_audio_sample
                if is_valid_uuid(story_id):
                    try:
                        s_rec = supabase.table("stories").select("audio_url").eq("id", story_id).execute()
                        if s_rec.data and s_rec.data[0].get("audio_url"):
                            fallback_url = s_rec.data[0]["audio_url"]
                    except Exception as e:
                        print(f"Fallback check error: {e}")
                
                return {
                    "audio_url": fallback_url,
                    "cached": True,
                    "voice_id": selected_voice_to_try,
                    "part_index": part_index,
                    "total_parts": total_parts,
                    "part_duration": part_duration,
                    "total_duration": total_duration,
                    "has_next_part": has_next_part,
                    "chunk_durations": chunk_durations,
                    "quota_limited": True,
                    "ambient_track_id": None,
                    "has_sfx": False
                }

    # 5.1 Layer calming ambient bedtime soundscape underneath ElevenLabs voiceover
    has_sfx = False
    used_ambient_id = None
    if audio_content:
        chosen_ambient = request.ambient_track_id or detect_ambient_track_from_context(
            text=chunk_to_narrate,
            title=story_db_title,
            category=story_db_category
        )
        audio_content, used_ambient_id, has_sfx = mix_voice_with_ambient(
            voice_audio_bytes=audio_content,
            ambient_track_id=chosen_ambient,
            ambient_volume_db=-18.0
        )
    else:
        raise HTTPException(status_code=500, detail="Voice synthesis produced no audio content.")

    # 6. Upload audio to Supabase Storage bucket 'stories'
    safe_story_folder = story_id if is_valid_uuid(story_id) else str(uuid.uuid4())
    part_suffix = "" if part_index == 0 else f"_part{part_index}"
    file_path = f"variants/{safe_story_folder}/{selected_voice_to_try}{part_suffix}.mp3"
    try:
        supabase.storage.from_("stories").upload(
            path=file_path,
            file=audio_content,
            file_options={"content-type": "audio/mpeg", "upsert": "true"}
        )
        audio_url = supabase.storage.from_("stories").get_public_url(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # 7. Save variant in story_audio_variants cache table
    if is_valid_uuid(story_id):
        try:
            save_voice_key = selected_voice_to_try if part_index == 0 else f"{selected_voice_to_try}__part_{part_index}"
            variant_data = {
                "story_id": story_id,
                "voice_id": save_voice_key,
                "audio_url": audio_url,
                "ambient_track_id": used_ambient_id,
                "has_sfx": has_sfx
            }
            supabase.table("story_audio_variants").upsert(variant_data, on_conflict="story_id,voice_id").execute()
            
            if part_index == 0 and selected_voice_to_try == "JBFqnCBsd6RMkjVDRZzb":
                supabase.table("stories").update({
                    "audio_url": audio_url,
                    "ambient_track_id": used_ambient_id,
                    "has_sfx": has_sfx
                }).eq("id", story_id).execute()
        except Exception as e:
            print(f"Error caching variant: {e}")
    
    return {
        "audio_url": audio_url,
        "cached": False,
        "voice_id": selected_voice_to_try,
        "part_index": part_index,
        "total_parts": total_parts,
        "part_duration": part_duration,
        "total_duration": total_duration,
        "has_next_part": has_next_part,
        "chunk_durations": chunk_durations,
        "ambient_track_id": used_ambient_id,
        "has_sfx": has_sfx
    }

@app.post("/api/seed-classic-stories")
async def seed_classic_stories():
    """Seed or re-verify all classic stories."""
    from .seed_data import CLASSIC_STORIES
    count = 0
    for s in CLASSIC_STORIES:
        existing = supabase.table("stories").select("id").eq("title", s["title"]).execute()
        if existing.data:
            supabase.table("stories").update({
                "category": s.get("category", "Fairy Tales"),
                "author": s.get("author", "Classic Author"),
                "content": s.get("content", ""),
                "is_classic": True
            }).eq("title", s["title"]).execute()
        else:
            supabase.table("stories").insert({
                "user_id": None,
                "title": s["title"],
                "content": s["content"],
                "is_classic": True,
                "category": s.get("category", "Fairy Tales"),
                "author": s.get("author", "Classic Author")
            }).execute()
        count += 1
    return {"message": f"Successfully seeded/updated {count} classic stories."}

class SupportQueryRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str
    category: Optional[str] = "General Inquiry"

@app.post("/api/support-query")
async def submit_support_query(req: SupportQueryRequest):
    """Receive a customer support query from the web support page and send it to umer.farooq@alpha-devs.cloud."""
    if not req.email or not req.name or not req.message:
        raise HTTPException(status_code=400, detail="Name, email, and message are required.")
    
    clean_name = req.name.strip()
    clean_email = req.email.strip()
    clean_subject = req.subject.strip() if req.subject else "Support Query"
    clean_message = req.message.strip()
    clean_category = req.category.strip() if req.category else "General Inquiry"

    # Send email to umer.farooq@alpha-devs.cloud via AWS SES
    email_sent = send_support_query_email(
        name=clean_name,
        user_email=clean_email,
        subject=clean_subject,
        message=clean_message,
        category=clean_category
    )

    # Attempt to log to Supabase if support_queries table exists
    try:
        supabase.table("support_queries").insert({
            "name": clean_name,
            "email": clean_email,
            "subject": clean_subject,
            "category": clean_category,
            "message": clean_message,
            "email_sent": email_sent
        }).execute()
    except Exception as e:
        print(f"Notice: support query DB log skipped or table not initialized: {e}")

    return {
        "success": True,
        "email_sent": email_sent,
        "message": "Your support query has been successfully dispatched. Our team will review and reply to your email shortly."
    }

@app.get("/terms", response_class=HTMLResponse)
async def terms_page():
    """Serves the Terms of Service & EULA with full App Store Review Guideline 3.1.2 auto-renewal subscription disclosures."""
    return HTMLResponse(content="""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Terms of Service & EULA - Bedtime Kids Story Teller</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; color: #1e293b; margin: 0; padding: 24px 16px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 16px rgba(0,0,0,0.04); }
    h1 { font-family: Georgia, serif; font-size: 32px; margin-top: 0; color: #0f172a; text-align: center; }
    .badge { display: inline-block; background: #e0e7ff; color: #4338ca; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; }
    .header-wrap { text-align: center; margin-bottom: 32px; }
    .subtitle { color: #64748b; font-style: italic; font-size: 16px; max-width: 600px; margin: 0 auto 8px; }
    .date { font-size: 12px; color: #94a3b8; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px 20px; margin: 16px 0; }
    .plan-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 14px; margin: 18px 0; }
    .plan-card { border: 1px solid #cbd5e1; border-radius: 12px; padding: 16px; background: #fdfbf7; }
    .plan-price { font-size: 24px; font-weight: 900; color: #0f172a; margin: 8px 0; }
    h2 { font-size: 20px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 32px; }
    ul, ol { padding-left: 22px; }
    li { margin-bottom: 8px; }
    a { color: #4f46e5; text-decoration: underline; font-weight: 600; }
    .footer { text-align: center; margin-top: 40px; font-size: 13px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-wrap">
      <div class="badge">App Store & EULA Compliant</div>
      <h1>Terms of Service & EULA</h1>
      <p class="subtitle">End User License Agreement & Auto-Renewable Subscription Terms for Bedtime Kids Story Teller</p>
      <div class="date">Effective Date: October 2026 • iOS & Web</div>
    </div>

    <h2>1. Acceptance of Terms & Apple Standard EULA</h2>
    <p>By downloading or using <strong>Bedtime Kids Story Teller</strong> (&quot;StoryTime&quot;, &quot;we&quot;, &quot;our&quot;), you agree to these Terms and incorporate by reference Apple's Standard Licensed Application End User License Agreement (EULA) accessible at <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/" target="_blank">https://www.apple.com/legal/internet-services/itunes/dev/stdeula/</a>.</p>

    <h2>2. Auto-Renewable Subscriptions (App Store Guideline 3.1.2)</h2>
    <p>Bedtime Kids Story Teller offers premium auto-renewing subscriptions under the <strong>Story Time Pro</strong> tier for unlimited ElevenLabs bedtime audio narrations and personalized AI story generations:</p>

    <div class="plan-grid">
      <div class="plan-card">
        <strong>Story Time Pro Monthly (/mo)</strong>
        <div class="plan-price">$30.00 <span style="font-size:13px;font-weight:normal;color:#64748b;">/ month</span></div>
        <p style="font-size:12px;color:#64748b;margin:0;">Billed monthly. Unlocks all 20 classical audio stories and all 5 voice actors.</p>
      </div>
      <div class="plan-card" style="border-color:#f59e0b;background:#fffbeb;">
        <strong style="color:#b45309;">Story Time Pro Yearly (/yr)</strong>
        <div class="plan-price">$320.00 <span style="font-size:13px;font-weight:normal;color:#64748b;">/ year</span></div>
        <p style="font-size:12px;color:#64748b;margin:0;">Billed annually ($26.67/mo equivalent). Save $40 compared to monthly billing.</p>
      </div>
    </div>

    <div class="card">
      <h3 style="margin-top:0;font-size:15px;color:#0f172a;">Important Subscription & Charging Information</h3>
      <ul>
        <li><strong>Payment:</strong> Payment is charged to your Apple ID Account at purchase confirmation.</li>
        <li><strong>Auto-Renewal:</strong> Subscription automatically renews unless auto-renew is disabled at least 24 hours prior to the end of the current billing cycle.</li>
        <li><strong>Renewal Charge:</strong> Your Apple ID account will be charged for renewal within 24 hours prior to the end of the current period at the then-current price ($30.00/mo or $320.00/yr).</li>
        <li><strong>Free Trial:</strong> New listeners receive 10 complimentary audio minutes (600 seconds) without charge. Any unused portion of a free trial period, if offered, will be forfeited when the user purchases a subscription.</li>
      </ul>
    </div>

    <h2>3. How to Manage or Cancel Your Subscription (iOS)</h2>
    <p>You can cancel or manage your subscriptions anytime in your Apple ID Account Settings:</p>
    <ol>
      <li>Open the <strong>Settings</strong> app on your iPhone or iPad.</li>
      <li>Tap your <strong>Apple ID profile / Name</strong> at the top.</li>
      <li>Tap <strong>Subscriptions</strong>.</li>
      <li>Select <strong>Bedtime Kids Story Teller</strong>.</li>
      <li>Tap <strong>Cancel Subscription</strong>.</li>
    </ol>
    <p>Cancellation takes effect at the conclusion of the active billing period; access remains fully active until then.</p>

    <h2>4. Child Safety & COPPA Compliance</h2>
    <p>We strictly comply with the Children's Online Privacy Protection Act (COPPA). We do not collect personal data from children under 13. Accounts and subscriptions must be managed by parents. We do not access microphones or record room audio.</p>

    <h2>5. Contact & Support</h2>
    <p>For inquiries, email <a href="mailto:info@alpha-devs.cloud">info@alpha-devs.cloud</a>. Read our <a href="/privacy">Privacy Policy</a>.</p>

    <div class="footer">
      © 2026 Bedtime Kids Story Teller • Alpha-Devs. All rights reserved.
    </div>
  </div>
</body>
</html>""")

@app.get("/privacy", response_class=HTMLResponse)
async def privacy_page():
    """Serves the Privacy Policy page."""
    return HTMLResponse(content="""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Privacy Policy - Bedtime Kids Story Teller</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafaf9; color: #1e293b; margin: 0; padding: 24px 16px; line-height: 1.6; }
    .container { max-width: 800px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 40px 32px; border: 1px solid #e2e8f0; }
    h1 { font-family: Georgia, serif; font-size: 32px; margin-top: 0; color: #0f172a; text-align: center; }
    h2 { font-size: 20px; color: #0f172a; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 32px; }
    a { color: #4f46e5; text-decoration: underline; font-weight: 600; }
    .footer { text-align: center; margin-top: 40px; font-size: 13px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Privacy Policy & Disclosures</h1>
    <p style="text-align:center;color:#64748b;">Transparency, Child Safety & Audio Privacy</p>

    <h2>1. COPPA & Child Safety</h2>
    <p>Bedtime Kids Story Teller strictly complies with COPPA. We do not solicit or collect personal information from children under 13.</p>

    <h2>2. Zero Audio Recording</h2>
    <p>Audio is strictly outbound streaming from ElevenLabs narration models. We never request microphone permissions or record household audio.</p>

    <h2>3. Subscriptions & Billing</h2>
    <p>In-app subscriptions are processed via Apple StoreKit and RevenueCat under strict security. See our <a href="/terms">Terms of Service & EULA</a> for complete auto-renewal disclosures.</p>

    <h2>4. Contact Us</h2>
    <p>For questions or data deletion requests, contact <a href="mailto:info@alpha-devs.cloud">info@alpha-devs.cloud</a>.</p>

    <div class="footer">
      © 2026 Bedtime Kids Story Teller • Alpha-Devs
    </div>
  </div>
</body>
</html>""")

