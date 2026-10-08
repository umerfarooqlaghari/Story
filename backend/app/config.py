import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Supabase Variables
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_SECRET_API_KEY", "")

# LLM / TTS Variables
ELEVENLABS_API_KEY = os.environ.get("ELEVENLABS_API_KEY", "")
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY", "")

# AWS SES Variables
AWS_ACCESS_KEY_ID = os.environ.get("AWSAccessKeyId", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWSSecretAccessKey", "")
AWS_REGION = os.environ.get("AWSRegion", "us-east-1")
FROM_EMAIL = os.environ.get("FromEmail", "")
FROM_NAME = os.environ.get("FromName", "")

# RevenueCat Variables
RC_SECRET_API_KEY = os.environ.get("RevenueCatSecretAPIKey", "")
RC_TEST_API_KEY = os.environ.get("RevenueCatTestStoreAPIKey", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
