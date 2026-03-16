from fastapi import APIRouter, HTTPException, Body
from app.database import supabase
from app.schemas.donation_schema import DonationCreate

router = APIRouter(
    prefix="/donations",
    tags=["Donations"]
)

# 1. FIX: Added the /available route that your frontend is looking for
@router.get("/available")
def get_available_donations():
    response = (
        supabase.table("donations")
        .select("*")
        .is_("claimed_by", "null")
        .execute()
    )
    return response.data

# 2. General GET all
@router.get("/")
def get_donations():
    response = supabase.table("donations").select("*").execute()
    return response.data

# 3. CREATE donation
@router.post("/")
def create_donation(donation: DonationCreate):
    donation_data = donation.model_dump(mode="json")
    response = supabase.table("donations").insert(donation_data).execute()
    return response.data

# 4. UPDATE / CLAIM donation
@router.put("/{donation_id}/claim")
def claim_donation(donation_id: int, data: dict = Body(...)):

    ngo_id = data.get("ngo_id")
    print("Received NGO ID:", repr(ngo_id))

    response = supabase.table("donations").update({
        "claimed_by": ngo_id,
        "status": "Claimed"
    }).eq("id", donation_id).execute()

    return response.data

@router.get("/claims/{ngo_id}")
def get_my_claims(ngo_id: str):

    response = supabase.table("donations") \
        .select("*") \
        .eq("claimed_by", ngo_id) \
        .execute()


    return response.data