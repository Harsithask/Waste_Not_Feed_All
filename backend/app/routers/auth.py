from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.user_schema import DonorRegister, NGORegister, VolunteerRegister, LoginSchema
from app.utils.dependencies import hash_password, verify_password
 
router = APIRouter()
 
 
# ══════════════════════════════════════════════════════════
#  REGISTER DONOR
# ══════════════════════════════════════════════════════════
@router.post("/register/donor")
def register_donor(user: DonorRegister):
    existing = supabase.table("donors").select("id").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
 
    hashed = hash_password(user.password)
 
    result = supabase.table("donors").insert({
        "name":     user.name,
        "email":    user.email,
        "phone":    user.phone,
        "address":  user.address or "Not provided",
        "password": hashed,
    }).execute()
 
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to register donor")
 
    return {
        "message": "Donor registered successfully",
        "userId":  result.data[0]["id"],
    }
 
 
# ══════════════════════════════════════════════════════════
#  REGISTER NGO
# ══════════════════════════════════════════════════════════
@router.post("/register/ngo")
def register_ngo(user: NGORegister):
    existing = supabase.table("ngos").select("id").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
 
    hashed = hash_password(user.password)
 
    result = supabase.table("ngos").insert({
        "name":                user.name,
        "email":               user.email,
        "phone":               user.phone,
        "organization_name":   user.organization_name,
        "registration_number": user.registration_number,
        "government_id":       user.registration_number,   # reuse reg number
        "address":             user.address or "Not provided",
        "city":                user.city,
        "state":               user.state,
        "document_url":        user.document_url or "",
        "verification_status": "pending",
        "password":            hashed,
    }).execute()
 
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to register NGO")
 
    return {
        "message": "NGO registered successfully and waiting for verification",
        "userId":  result.data[0]["id"],
    }
 
 
# ══════════════════════════════════════════════════════════
#  REGISTER VOLUNTEER
# ══════════════════════════════════════════════════════════
@router.post("/register/volunteer")
def register_volunteer(user: VolunteerRegister):
    existing = supabase.table("volunteers").select("id").eq("email", user.email).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Email already registered")
 
    hashed = hash_password(user.password)
 
    result = supabase.table("volunteers").insert({
        "name":     user.name,
        "email":    user.email,
        "phone":    user.phone,
        "city":     user.city,
        "password": hashed,
    }).execute()
 
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to register volunteer")
 
    return {
        "message": "Volunteer registered successfully",
        "userId":  result.data[0]["id"],
    }
 
 
# ══════════════════════════════════════════════════════════
#  LOGIN  (auto-detect role — no role field needed from frontend)
# ══════════════════════════════════════════════════════════
@router.post("/login")
def login(user: LoginSchema):
    """
    Tries donors → ngos → volunteers in order.
    Returns { role, user } on success.
    """
    tables = [
        ("donor",     "donors"),
        ("ngo",       "ngos"),
        ("volunteer", "volunteers"),
    ]
 
    for role, table in tables:
        result = supabase.table(table).select("*").eq("email", user.email).execute()
        if not result.data:
            continue
 
        db_user = result.data[0]
 
        if not verify_password(user.password, db_user["password"]):
            raise HTTPException(status_code=401, detail="Invalid password")
 
        # NGO must be approved before login
        if role == "ngo" and db_user.get("verification_status") != "approved":
            raise HTTPException(
                status_code=403,
                detail="NGO account not verified yet. Please wait for admin approval.",
            )
 
        # Strip password from response
        db_user.pop("password", None)
 
        return {
            "message": "Login successful",
            "role":    role,
            "user":    db_user,
        }
 
    raise HTTPException(status_code=404, detail="User not found")