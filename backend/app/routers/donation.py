from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
 
router = APIRouter(
    prefix="/donations",
    tags=["Donations"],
)
 
 
# ── Schemas ────────────────────────────────────────────────
class DonationCreate(BaseModel):
    name:            str
    type:            Optional[str]  = None
    pickup_location: Optional[str]  = None
    contact_no:      Optional[str]  = None
    expiry:          Optional[str]  = None
    quantity:        Optional[int]  = None
    description:     Optional[str]  = None
    donor_name:      Optional[str]  = None
    status:          Optional[str]  = "available"
 
 
class ClaimRequest(BaseModel):
    ngo_id: str
 
 
# ══════════════════════════════════════════════════════════
#  POST /donations  — create a new donation
# ══════════════════════════════════════════════════════════
@router.post("/")
def create_donation(donation: DonationCreate):
    result = supabase.table("donations").insert(
        donation.model_dump(exclude_none=True)
    ).execute()
 
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create donation")
 
    return result.data[0]
 
 
# ══════════════════════════════════════════════════════════
#  GET /donations  — all donations (donor dashboard)
# ══════════════════════════════════════════════════════════
@router.get("/")
def get_all_donations():
    result = supabase.table("donations").select("*").order("id", desc=True).execute()
    return result.data or []
 
 
# ══════════════════════════════════════════════════════════
#  GET /donations/available  — only unclaimed donations
# ══════════════════════════════════════════════════════════
@router.get("/available")
def get_available_donations():
    result = (
        supabase.table("donations")
        .select("*")
        .eq("status", "available")
        .execute()
    )
    return result.data or []
 
 
# ══════════════════════════════════════════════════════════
#  GET /donations/claims/:ngo_id  — donations claimed by NGO
# ══════════════════════════════════════════════════════════
@router.get("/claims/{ngo_id}")
def get_my_claims(ngo_id: str):
    result = (
        supabase.table("donations")
        .select("*")
        .eq("claimed_by", ngo_id)
        .execute()
    )
    return result.data or []
 
 
# ══════════════════════════════════════════════════════════
#  PUT /donations/:id/claim  — NGO claims a donation
# ══════════════════════════════════════════════════════════
@router.put("/{donation_id}/claim")
def claim_donation(donation_id: int, body: ClaimRequest):
    # Check donation exists and is still available
    check = (
        supabase.table("donations")
        .select("id, status")
        .eq("id", donation_id)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Donation not found")
 
    if check.data[0]["status"] != "available":
        raise HTTPException(status_code=400, detail="Donation is no longer available")
 
    result = (
        supabase.table("donations")
        .update({"status": "claimed", "claimed_by": body.ngo_id})
        .eq("id", donation_id)
        .execute()
    )
 
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to claim donation")
 
    return {"message": "Donation claimed successfully", "donation": result.data[0]}
 
 
# ══════════════════════════════════════════════════════════
#  PUT /donations/:id  — generic update
# ══════════════════════════════════════════════════════════
@router.put("/{donation_id}")
def update_donation(donation_id: int, donation: dict):
    result = (
        supabase.table("donations")
        .update(donation)
        .eq("id", donation_id)
        .execute()
    )
    return result.data
 
 
# ══════════════════════════════════════════════════════════
#  DELETE /donations/:id
# ══════════════════════════════════════════════════════════
@router.delete("/{donation_id}")
def delete_donation(donation_id: int):
    result = (
        supabase.table("donations")
        .delete()
        .eq("id", donation_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Donation not found")
 
    return {"message": "Donation deleted successfully"}