import os
import random
import boto3
import jwt
import bcrypt
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

load_dotenv()

AWS_ACCESS_KEY_ID = os.environ.get("AWSAccessKeyId", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWSSecretAccessKey", "")
AWS_REGION = os.environ.get("AWSRegion", "us-east-1")
FROM_EMAIL = os.environ.get("FromEmail", "StoryTime@alpha-devs.cloud")
FROM_NAME = os.environ.get("FromName", "Bed time Stories")
JWT_SECRET = os.environ.get("SUPABASE_SECRET_API_KEY", "story-teller-secure-jwt-secret-2026")

def get_ses_client():
    return boto3.client(
        "ses",
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )

def send_ses_otp_email(to_email: str, otp_code: str, purpose: str = "signup") -> bool:
    """Send a stylized, elegant OTP verification email via AWS SES."""
    client = get_ses_client()
    
    action_text = "confirm your registration" if purpose == "signup" else "reset your password"
    title_text = "Verification Code" if purpose == "signup" else "Password Reset Code"

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdfbf7; margin: 0; padding: 24px; }}
        .card {{ max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 36px 28px; border: 1px solid #ede8de; box-shadow: 0 4px 14px rgba(0,0,0,0.06); text-align: center; }}
        .logo {{ font-size: 32px; margin-bottom: 12px; }}
        h1 {{ font-size: 24px; color: #111827; margin: 0 0 8px 0; font-family: Georgia, serif; }}
        p {{ color: #6b7280; font-size: 14px; line-height: 1.6; margin: 0 0 24px 0; }}
        .otp-box {{ background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 16px 24px; display: inline-block; margin-bottom: 24px; }}
        .otp-code {{ font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #0f172a; font-family: monospace; }}
        .expiry {{ font-size: 12px; color: #94a3b8; }}
        .footer {{ font-size: 11px; color: #9ca3af; margin-top: 24px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">🌙</div>
        <h1>{title_text}</h1>
        <p>Please use this 6-digit one-time code to {action_text} for Bedtime Stories.</p>
        <div class="otp-box">
          <div class="otp-code">{otp_code}</div>
          <div class="expiry">Expires in 10 minutes</div>
        </div>
        <p class="footer">If you did not request this verification code, you can safely disregard this email.</p>
      </div>
    </body>
    </html>
    """

    try:
        response = client.send_email(
            Source=f"{FROM_NAME} <{FROM_EMAIL}>",
            Destination={"ToAddresses": [to_email]},
            Message={
                "Subject": {"Data": f"Your Bedtime Stories {title_text}: {otp_code}", "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": html_body, "Charset": "UTF-8"},
                    "Text": {"Data": f"Your Bedtime Stories code is {otp_code}. It expires in 10 minutes.", "Charset": "UTF-8"}
                }
            }
        )
        return True
    except Exception as e:
        print(f"SES Send Error to {to_email}: {e}")
        return False

def hash_password(password: str) -> str:
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode('utf-8')[:72]
        return bcrypt.checkpw(pwd_bytes, hashed_password.encode('utf-8'))
    except Exception:
        return False

def generate_otp() -> str:
    return f"{random.randint(100000, 999999)}"

def create_tokens(user_id: str, email: str) -> dict:
    """Create JWT access token and refresh token valid for 30 days."""
    now = datetime.now(timezone.utc)
    expires_delta = timedelta(days=30)
    expires_at = now + expires_delta

    access_payload = {
        "sub": user_id,
        "email": email,
        "type": "access",
        "iat": now,
        "exp": expires_at
    }

    refresh_payload = {
        "sub": user_id,
        "email": email,
        "type": "refresh",
        "iat": now,
        "exp": expires_at
    }

    access_token = jwt.encode(access_payload, JWT_SECRET, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, JWT_SECRET, algorithm="HS256")

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "expires_in_days": 30
    }

def verify_jwt_token(token: str) -> dict | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except Exception:
        return None
