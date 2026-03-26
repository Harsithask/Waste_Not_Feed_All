import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

# Load env file
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)
SUPABASE_URL='https://xwhstezzheoaxxegbajd.supabase.co'
SUPABASE_KEY='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3aHN0ZXp6aGVvYXh4ZWdiYWpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI3OTMyMTIsImV4cCI6MjA4ODM2OTIxMn0.en_av8K9vAU7tzHbAIWGQP9BdIYRtyPw2m3mLMndsG4'
# SUPABASE_URL = os.getenv("SUPABASE_URL")
# SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("Supabase credentials missing")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)