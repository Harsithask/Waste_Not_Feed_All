from fastapi import APIRouter, HTTPException
from app.database import supabase
from app.schemas.user_schema import *
from app.utils.dependencies import hash_password, verify_password

router = APIRouter()

# -------- DONOR REGISTER --------

@router.post("/register/donor")
def register_donor(user: DonorRegister):

    # check if email already exists
    existing = supabase.table("donors").select("*").eq("email", user.email).execute()

    if len(existing.data) > 0:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    password = hash_password(user.password)

    data = supabase.table("donors").insert({
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "address": user.address,
        "password": password
    }).execute()

    return {
        "message": "Donor registered successfully",
        "data": data.data
}
# -------- NGO REGISTER --------

@router.post("/register/ngo")
def register_ngo(user: NGORegister):

    # check if email already exists
    existing = supabase.table("ngos").select("*").eq("email", user.email).execute()

    if len(existing.data) > 0:
        raise HTTPException(status_code=400, detail="Email already registered")

    password = hash_password(user.password)

    supabase.table("ngos").insert({
        "name": user.name,
        "email": user.email,
        "phone": user.phone,

        "organization_name": user.organization_name,
        "registration_number": user.registration_number,
        "government_id": user.government_id,

        "address": user.address,
        "city": user.city,
        "state": user.state,

        "document_url": user.document_url,

        "password": password
    }).execute()

    return {"message": "NGO registered successfully and waiting for verification"}

# -------- VOLUNTEER REGISTER --------

@router.post("/register/volunteer")
def register_volunteer(user: VolunteerRegister):

    # check if email already exists
    existing = supabase.table("volunteers").select("*").eq("email", user.email).execute()

    if len(existing.data) > 0:
        raise HTTPException(status_code=400, detail="Email already registered")

    password = hash_password(user.password)

    supabase.table("volunteers").insert({
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "city": user.city,
        "password": password
    }).execute()

    return {"message": "Volunteer registered successfully"}

# -------- LOGIN --------

@router.post("/login")
def login(user: LoginSchema):

    tables = [
        ("donors", "donor"),
        ("ngos", "ngo"),
        ("volunteers", "volunteer")
    ]

    db_user = None
    role = None

    for table_name, role_name in tables:

        result = supabase.table(table_name).select("*").eq("email", user.email).execute()

        if len(result.data) > 0:
            db_user = result.data[0]
            role = role_name
            break

    if not db_user:
        raise HTTPException(status_code=404, detail="Email not registered")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=401, detail="Wrong password")

    if role == "ngo":
        if db_user["verification_status"] != "approved":
            raise HTTPException(
                status_code=403,
                detail="NGO account not verified yet"
            )

    user_data = {
        "id": db_user["id"],
        "name": db_user["name"],
        "email": db_user["email"]
    }

    return {
        "message": "Login successful",
        "role": role,
        "user": user_data
    }