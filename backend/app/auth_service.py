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

def send_support_query_email(
    name: str,
    user_email: str,
    subject: str,
    message: str,
    category: str = "General Inquiry"
) -> bool:
    """Send an inbound user support query email to umer.farooq@alpha-devs.cloud via AWS SES."""
    client = get_ses_client()
    target_destination = "umer.farooq@alpha-devs.cloud"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdfbf7; margin: 0; padding: 24px; color: #1e293b; }}
        .card {{ max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .badge {{ display: inline-block; padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }}
        h1 {{ font-size: 22px; color: #0f172a; margin: 16px 0 8px 0; font-family: Georgia, serif; }}
        .meta {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }}
        .meta-row {{ margin-bottom: 8px; font-size: 14px; }}
        .meta-row:last-child {{ margin-bottom: 0; }}
        .meta-label {{ font-weight: 700; color: #64748b; }}
        .meta-value {{ color: #0f172a; font-weight: 500; }}
        .message-box {{ background: #fafafa; border-left: 4px solid #f59e0b; border-radius: 4px; padding: 16px; font-size: 15px; line-height: 1.6; color: #334155; white-space: pre-wrap; margin: 20px 0; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">{category}</span>
        <h1>New StoryTime Support Query</h1>
        <div class="meta">
          <div class="meta-row"><span class="meta-label">From Name:</span> <span class="meta-value">{name}</span></div>
          <div class="meta-row"><span class="meta-label">Reply-To Email:</span> <span class="meta-value"><a href="mailto:{user_email}">{user_email}</a></span></div>
          <div class="meta-row"><span class="meta-label">Category:</span> <span class="meta-value">{category}</span></div>
          <div class="meta-row"><span class="meta-label">Subject:</span> <span class="meta-value">{subject}</span></div>
        </div>
        <div class="message-box">{message}</div>
        <div class="footer">
          Submitted via StoryTime Web Support Portal • Support inquiries channel: info@alpha-devs.cloud
        </div>
      </div>
    </body>
    </html>
    """

    try:
        client.send_email(
            Source=f"StoryTime Support <{FROM_EMAIL}>",
            Destination={"ToAddresses": [target_destination]},
            ReplyToAddresses=[user_email],
            Message={
                "Subject": {"Data": f"[StoryTime Support Query] {subject} - {name}", "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": html_body, "Charset": "UTF-8"},
                    "Text": {"Data": f"StoryTime Support Query\n\nName: {name}\nEmail: {user_email}\nCategory: {category}\nSubject: {subject}\n\nMessage:\n{message}", "Charset": "UTF-8"}
                }
            }
        )
        return True
    except Exception as e:
        print(f"SES Support Query Send Error: {e}")
        return False

def send_book_request_email(user_name: str, user_email: str, title: str, author: str, category: str, notes: str) -> bool:
    """Dispatches a book request notification email to info@alpha-devs.cloud."""
    client = get_ses_client()
    target_destination = "info@alpha-devs.cloud"
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fdfbf7; margin: 0; padding: 24px; color: #1e293b; }}
        .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 16px; padding: 32px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }}
        .badge {{ display: inline-block; padding: 4px 12px; background: #e0e7ff; color: #3730a3; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; }}
        h1 {{ font-size: 22px; color: #0f172a; margin: 16px 0 8px 0; font-family: Georgia, serif; }}
        .meta {{ background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin: 20px 0; }}
        .meta-row {{ margin-bottom: 8px; font-size: 14px; }}
        .meta-row:last-child {{ margin-bottom: 0; }}
        .meta-label {{ font-weight: 700; color: #64748b; }}
        .meta-value {{ color: #0f172a; font-weight: 600; }}
        .notes-box {{ background: #fafafa; border-left: 4px solid #6366f1; border-radius: 4px; padding: 14px 16px; font-size: 14px; line-height: 1.6; color: #334155; margin: 20px 0; }}
        .footer {{ font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <span class="badge">📖 Book Request</span>
        <h1>New Story Request from Reader</h1>
        <div class="meta">
          <div class="meta-row"><span class="meta-label">Requested Book:</span> <span class="meta-value">{title}</span></div>
          <div class="meta-row"><span class="meta-label">Author:</span> <span class="meta-value">{author or 'Not specified'}</span></div>
          <div class="meta-row"><span class="meta-label">Category:</span> <span class="meta-value">{category}</span></div>
          <div class="meta-row"><span class="meta-label">Requested By:</span> <span class="meta-value">{user_name} ({user_email})</span></div>
        </div>
        {f'<div class="notes-box"><strong>Reader Notes:</strong><br/>{notes}</div>' if notes else ''}
        <div class="footer">Submitted via StoryTime App Book Request Portal</div>
      </div>
    </body>
    </html>
    """

    try:
        client.send_email(
            Source=f"StoryTime Requests <StoryTime@alpha-devs.cloud>",
            Destination={"ToAddresses": [target_destination]},
            ReplyToAddresses=[user_email] if user_email else [],
            Message={
                "Subject": {"Data": f"[StoryTime Book Request] \"{title}\" requested by {user_name}", "Charset": "UTF-8"},
                "Body": {
                    "Html": {"Data": html_body, "Charset": "UTF-8"},
                    "Text": {"Data": f"New Book Request\n\nTitle: {title}\nAuthor: {author}\nCategory: {category}\nRequested by: {user_name} ({user_email})\nNotes: {notes}", "Charset": "UTF-8"}
                }
            }
        )
        return True
    except Exception as e:
        print(f"SES Book Request Send Error: {e}")
        return False

def send_new_story_broadcast_email(recipient_emails: list[str], author_name: str, story_title: str, category: str, snippet: str = "") -> int:
    """
    Dispatches a public release announcement email to all registered readers.
    Sender: newstory@alpha-devs.cloud
    """
    if not recipient_emails:
        return 0

    client = get_ses_client()
    clean_snippet = (snippet[:200] + "...") if len(snippet) > 200 else snippet

    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fbf9f4; margin: 0; padding: 24px; color: #1e293b; }}
        .card {{ max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 18px; padding: 36px 30px; border: 1px solid #ede8de; box-shadow: 0 4px 18px rgba(0,0,0,0.06); text-align: center; }}
        .star-badge {{ display: inline-block; padding: 5px 14px; background: #fef3c7; color: #92400e; border-radius: 9999px; font-size: 11px; font-weight: 800; letter-spacing: 0.5px; text-transform: uppercase; margin-bottom: 12px; }}
        h1 {{ font-size: 26px; color: #0f172a; margin: 0 0 10px 0; font-family: Georgia, serif; line-height: 1.3; }}
        .byline {{ font-size: 14px; color: #64748b; margin-bottom: 20px; }}
        .author-name {{ color: #0f172a; font-weight: 700; }}
        .book-frame {{ background: #faf8f5; border: 1px solid #e8e2d5; border-radius: 12px; padding: 20px; text-align: left; margin: 24px 0; }}
        .book-category {{ font-size: 11px; font-weight: 700; color: #d97706; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }}
        .book-snippet {{ font-size: 14px; color: #475569; line-height: 1.6; font-style: italic; }}
        .cta-btn {{ display: inline-block; background-color: #0f172a; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 14px 28px; border-radius: 9999px; margin-top: 10px; }}
        .footer {{ font-size: 11px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; }}
      </style>
    </head>
    <body>
      <div class="card">
        <div class="star-badge">✨ New Story on StoryTime</div>
        <h1>"{story_title}"</h1>
        <div class="byline">Published by <span class="author-name">{author_name}</span></div>
        <div class="book-frame">
          <div class="book-category">★ {category} ★</div>
          <div class="book-snippet">"{clean_snippet}"</div>
        </div>
        <a href="https://story-frontend-efhu.onrender.com" class="cta-btn">Listen on StoryTime</a>
        <div class="footer">
          You are receiving this bedtime story release notification from StoryTime.<br/>
          Broadcast via newstory@alpha-devs.cloud • Sweet dreams!
        </div>
      </div>
    </body>
    </html>
    """

    sent_count = 0
    # Send in batches of 40 to avoid SES single-call limits
    for email in recipient_emails:
        try:
            client.send_email(
                Source=f"StoryTime Releases <newstory@alpha-devs.cloud>",
                Destination={"ToAddresses": [email]},
                Message={
                    "Subject": {"Data": f"✨ New Bedtime Story: \"{story_title}\" by {author_name}", "Charset": "UTF-8"},
                    "Body": {
                        "Html": {"Data": html_body, "Charset": "UTF-8"},
                        "Text": {"Data": f"New Bedtime Story Released!\n\n\"{story_title}\"\nBy {author_name}\nCategory: {category}\n\nSnippet:\n{clean_snippet}\n\nListen now on StoryTime!", "Charset": "UTF-8"}
                    }
                }
            )
            sent_count += 1
        except Exception as e:
            print(f"SES Broadcast error sending to {email}: {e}")

    return sent_count

