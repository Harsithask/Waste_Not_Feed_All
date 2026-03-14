from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
 
from app.routers import auth
from app.routers.donation import router as donation_router
from app.routers.ngo import router as ngo_router
from app.routers.hotspot import router as hotspot_router
from app.database import supabase
 
app = FastAPI(title="Waste Not Feed All API", version="2.0.0")
 
# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
 
# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router,      prefix="/auth",    tags=["Auth"])
app.include_router(donation_router)                   # prefix="/donations" already set
app.include_router(ngo_router)                        # prefix="/ngo" already set
app.include_router(hotspot_router,   prefix="/hotspot", tags=["Hotspot"])
 
 
# ── Standalone /volunteers route (used by AssignVolunteers screen) ────────────
@app.get("/volunteers", tags=["Volunteers"])
def get_all_volunteers():
    result = supabase.table("volunteers").select("id, name, email, phone, city").execute()
    return result.data or []
 
 
# ── Health / debug ─────────────────────────────────────────────────────────────
@app.get("/", tags=["Health"])
def root():
    return {"message": "Waste Not Feed All API is running 🚀"}
 
 
@app.get("/db-test", tags=["Health"])
def db_test():
    result = supabase.table("donors").select("*").execute()
    return result.data