import os
from supabase import create_client
from dotenv import load_dotenv
from pathlib import Path

<<<<<<< HEAD
# Load env file
=======
>>>>>>> 42d598a (Updated donation backend and frontend)
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(env_path)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
<<<<<<< HEAD
    raise ValueError("Supabase credentials missing")
=======
    raise Exception("Supabase credentials missing")
>>>>>>> 42d598a (Updated donation backend and frontend)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)