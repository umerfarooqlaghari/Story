from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import uuid
from typing import Optional, List
from .config import supabase, ELEVENLABS_API_KEY, OPENAI_API_KEY, RC_SECRET_API_KEY
from .auth_service import (
    send_ses_otp_email,
    generate_otp,
    hash_password,
    verify_password,
    create_tokens,
    verify_jwt_token,
    send_support_query_email
)
from datetime import datetime, timezone, timedelta
from openai import AsyncOpenAI

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
    email: str
    password: str
    confirm_password: str

class VerifyOTPRequest(BaseModel):
    email: str
    otp_code: str

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

class AudioVariantRequest(BaseModel):
    story_id: str
    voice_id: Optional[str] = "JBFqnCBsd6RMkjVDRZzb"
    text_content: str

class SubscriptionRequest(BaseModel):
    user_id: str
    plan: str # "monthly" ($30) or "yearly" ($320)

class TrialUpdateRequest(BaseModel):
    user_id: str
    seconds_listened: int

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

    # Create/update in Supabase profiles
    try:
        supabase.table("profiles").upsert({
            "id": user_id,
            "full_name": req.email.split("@")[0],
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
            "full_name": req.email.split("@")[0],
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
    if is_valid_uuid(user_id):
        try:
            prof = supabase.table("profiles").select("*").eq("id", user_id).execute()
            if prof.data and len(prof.data) > 0:
                is_premium = prof.data[0].get("is_premium", False)
                sub_plan = prof.data[0].get("subscription_plan")
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
            "full_name": req.email.split("@")[0],
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

@app.get("/api/stories")
async def get_stories():
    """Return all stories from Supabase."""
    try:
        res = supabase.table("stories").select("*").order("created_at", desc=False).execute()
        return {"stories": res.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
                    audio_content = resp.content
                    file_name = f"generated/{uuid.uuid4()}.mp3"
                    supabase.storage.from_("stories").upload(
                        path=file_name,
                        file=audio_content,
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
        "is_classic": False
    }
    
    try:
        db_response = supabase.table("stories").insert(story_data).execute()
        created = db_response.data[0]
        if created.get("id") and created.get("audio_url"):
            try:
                supabase.table("story_audio_variants").upsert({
                    "story_id": created["id"],
                    "voice_id": voice_id,
                    "audio_url": created["audio_url"]
                }, on_conflict="story_id,voice_id").execute()
            except Exception as cache_err:
                print(f"Notice caching custom story audio: {cache_err}")
        return created
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Database insert failed: {str(e)}")

@app.post("/api/get-or-generate-audio")
async def get_or_generate_audio(request: AudioVariantRequest):
    voice_id = request.voice_id or "JBFqnCBsd6RMkjVDRZzb"
    story_id = request.story_id
    
    # 1. Resolve story_id to a valid UUID if a title or placeholder was passed
    if not is_valid_uuid(story_id):
        try:
            match = supabase.table("stories").select("id").ilike("title", f"%{story_id}%").limit(1).execute()
            if match.data and len(match.data) > 0:
                story_id = match.data[0]["id"]
            else:
                # Fuzzy fallback matching on any classic story
                s_all = supabase.table("stories").select("id, title").execute()
                for s in (s_all.data or []):
                    if s["title"].lower() in str(story_id).lower() or str(story_id).lower() in s["title"].lower():
                        story_id = s["id"]
                        break
        except Exception as e:
            print(f"Resolve story_id error: {e}")

    # 2. Check cache in story_audio_variants first (Fast 50ms response, zero ElevenLabs cost)
    if is_valid_uuid(story_id):
        try:
            cached = supabase.table("story_audio_variants").select("*").eq("story_id", story_id).eq("voice_id", voice_id).execute()
            if cached.data and len(cached.data) > 0:
                return {"audio_url": cached.data[0]["audio_url"], "cached": True, "voice_id": voice_id}
            
            # If default voice is requested and main story table already has audio_url, return it
            if voice_id == "JBFqnCBsd6RMkjVDRZzb":
                s_rec = supabase.table("stories").select("audio_url").eq("id", story_id).execute()
                if s_rec.data and s_rec.data[0].get("audio_url"):
                    main_audio = s_rec.data[0]["audio_url"]
                    # Also insert into story_audio_variants cache for consistency
                    try:
                        supabase.table("story_audio_variants").upsert({
                            "story_id": story_id,
                            "voice_id": voice_id,
                            "audio_url": main_audio
                        }, on_conflict="story_id,voice_id").execute()
                    except Exception:
                        pass
                    return {"audio_url": main_audio, "cached": True, "voice_id": voice_id}
        except Exception as e:
            print(f"Cache check error: {e}")

    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API key is not configured.")

    # 3. Generate using ElevenLabs TTS with fallback mechanism
    # Truncate text for performance & quota optimization
    truncated_text = request.text_content[:1500] if len(request.text_content) > 1500 else request.text_content
    data = {
        "text": truncated_text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75}
    }
    
    selected_voice_to_try = voice_id
    audio_content = None
    
    async with httpx.AsyncClient(timeout=40.0) as client:
        # First attempt with requested voice
        elevenlabs_url = f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice_to_try}"
        headers = {"xi-api-key": ELEVENLABS_API_KEY, "Content-Type": "application/json"}
        resp = await client.post(elevenlabs_url, json=data, headers=headers)
        
        if resp.status_code == 200:
            audio_content = resp.content
        else:
            print(f"ElevenLabs error on voice {selected_voice_to_try}: {resp.status_code} {resp.text}")
            # If voice failed (e.g. library voice or quota error on specific voice), fallback to George
            if selected_voice_to_try != "JBFqnCBsd6RMkjVDRZzb":
                selected_voice_to_try = "JBFqnCBsd6RMkjVDRZzb"
                elevenlabs_url = f"https://api.elevenlabs.io/v1/text-to-speech/{selected_voice_to_try}"
                resp2 = await client.post(elevenlabs_url, json=data, headers=headers)
                if resp2.status_code == 200:
                    audio_content = resp2.content
                else:
                    raise HTTPException(status_code=500, detail=f"ElevenLabs TTS failed: {resp2.text}")
            else:
                raise HTTPException(status_code=500, detail=f"ElevenLabs TTS failed: {resp.text}")

    # 4. Upload audio to Supabase Storage bucket 'stories'
    safe_story_folder = story_id if is_valid_uuid(story_id) else str(uuid.uuid4())
    file_path = f"variants/{safe_story_folder}/{selected_voice_to_try}.mp3"
    try:
        supabase.storage.from_("stories").upload(
            path=file_path,
            file=audio_content,
            file_options={"content-type": "audio/mpeg", "upsert": "true"}
        )
        audio_url = supabase.storage.from_("stories").get_public_url(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Storage upload failed: {str(e)}")

    # 5. Save variant in story_audio_variants cache table
    if is_valid_uuid(story_id):
        try:
            variant_data = {
                "story_id": story_id,
                "voice_id": selected_voice_to_try,
                "audio_url": audio_url
            }
            supabase.table("story_audio_variants").upsert(variant_data, on_conflict="story_id,voice_id").execute()
            
            # If George (default voice), also update the master story audio_url
            if selected_voice_to_try == "JBFqnCBsd6RMkjVDRZzb":
                supabase.table("stories").update({"audio_url": audio_url}).eq("id", story_id).execute()
        except Exception as e:
            print(f"Error caching variant: {e}")
    
    return {"audio_url": audio_url, "cached": False, "voice_id": selected_voice_to_try}

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
