from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, volunteer, donation
from app.database import supabase
# from app.routers import donation
# from app.routers.donation import router as donation_router
from app.routers.ngo import router as ngo_router
from app.routers.hotspot import router as hotspot_router
from app.routers.donation import router as donation_router
from app.routers.notifications import router as notifications_router

app = FastAPI(title="Waste Not Feed All API", version="2.0.0")

origins = [
    "http://localhost:8081",
    "http://127.0.0.1:8081",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/db-test")
def db_test():
    result = supabase.table("donors").select("*").execute()
    return result.data

@app.get("/")
def root():
    return {"message": "Waste Not Feed All API"}

# # ── Standalone /volunteers route (used by AssignVolunteers screen) ────────────
# @app.get("/volunteers", tags=["Volunteers"])
# def get_all_volunteers():
#     result = supabase.table("volunteers").select("id, name, email, phone, city").execute()
#     return result.data or []

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
# app.include_router(donation.router)
app.include_router(donation_router)                   # prefix="/donations" already set
app.include_router(ngo_router)                        # prefix="/ngo" already set
app.include_router(hotspot_router,   prefix="/hotspot", tags=["Hotspot"])
app.include_router(volunteer.router, prefix="/volunteer", tags=["Volunteer"])
app.include_router(donation.router, prefix="/donation", tags=["Donation"])
app.include_router(notifications_router)