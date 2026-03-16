import math
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
    type:            Optional[str] = None
    pickup_location: Optional[str] = None
    contact_no:      Optional[str] = None
    expiry:          Optional[str] = None
    quantity:        Optional[int] = None
    description:     Optional[str] = None
    donor_name:      Optional[str] = None
    status:          Optional[str] = "available"
 
 
class ClaimRequest(BaseModel):
    ngo_id: str
 
 
# ── Haversine distance (km) ────────────────────────────────
def haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (math.sin(d_lat / 2) ** 2 +
         math.cos(math.radians(lat1)) *
         math.cos(math.radians(lat2)) *
         math.sin(d_lng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
 
 
# ── Find nearest red zone to a lat/lng ────────────────────
def get_nearest_red_zone(lat: float, lng: float):
    try:
        res = (
            supabase.table("hotspot_clusters")
            .select("*")
            .eq("red_zone", True)
            .order("gap_percentage", desc=True)
            .execute()
        )
        clusters = res.data or []
 
        if not clusters:
            # fallback to highest demand zone
            res2 = (
                supabase.table("hotspot_clusters")
                .select("*")
                .order("total_demand", desc=True)
                .limit(1)
                .execute()
            )
            clusters = res2.data or []
 
        if not clusters:
            return None
 
        nearest = min(
            clusters,
            key=lambda c: haversine(
                lat, lng,
                float(c["centroid_lat"]),
                float(c["centroid_lng"])
            )
        )
        nearest["distance_km"] = round(
            haversine(lat, lng,
                      float(nearest["centroid_lat"]),
                      float(nearest["centroid_lng"])), 1
        )
        return nearest
    except Exception:
        return None
 
 
# ══════════════════════════════════════════════════════════
#  POST /donations
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
#  GET /donations
# ══════════════════════════════════════════════════════════
@router.get("/")
def get_all_donations():
    result = supabase.table("donations").select("*").order("id", desc=True).execute()
    return result.data or []
 
 
# ══════════════════════════════════════════════════════════
#  GET /donations/available
# ══════════════════════════════════════════════════════════
@router.get("/available")
def get_available_donations():
    result = supabase.table("donations").select("*").execute()
    data = [d for d in (result.data or [])
            if str(d.get("status", "")).lower() == "available"]
    return data
 
 
# ══════════════════════════════════════════════════════════
#  GET /donations/claims/:ngo_id
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
#  PUT /donations/:id/claim
#  After claiming → auto-find nearest red zone
# ══════════════════════════════════════════════════════════
@router.put("/{donation_id}/claim")
def claim_donation(donation_id: int, body: ClaimRequest):
    # Check donation exists
    check = (
        supabase.table("donations")
        .select("*")
        .eq("id", donation_id)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Donation not found")
 
    current_status = str(check.data[0].get("status", "")).lower()
    if current_status != "available":
        raise HTTPException(status_code=400, detail="Donation is no longer available")
 
    # Claim the donation
    result = (
        supabase.table("donations")
        .update({"status": "claimed", "claimed_by": body.ngo_id})
        .eq("id", donation_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to claim donation")
 
    donation = result.data[0]
 
    # ── Find nearest red zone ──────────────────────────────
    recommendation = None
    rec_message    = None
 
    don_lat = donation.get("latitude")
    don_lng = donation.get("longitude")
 
    if don_lat and don_lng:
        # Donation has coordinates — find nearest red zone
        zone = get_nearest_red_zone(float(don_lat), float(don_lng))
        if zone:
            recommendation = zone
            rec_message = (
                f"📍 Deliver to {zone['zone_label']} "
                f"({zone['severity'].upper()}) — "
                f"{zone['gap_percentage']}% demand unmet, "
                f"~{zone['distance_km']} km from pickup"
            )
    else:
        # No coordinates — return most critical zone overall
        try:
            res = (
                supabase.table("hotspot_clusters")
                .select("*")
                .eq("red_zone", True)
                .order("gap_percentage", desc=True)
                .limit(1)
                .execute()
            )
            if res.data:
                zone = res.data[0]
                recommendation = zone
                rec_message = (
                    f"📍 Most critical zone: {zone['zone_label']} "
                    f"({zone['severity'].upper()}) — "
                    f"{zone['gap_percentage']}% demand unmet. "
                    f"Deliver food here!"
                )
        except Exception:
            pass
 
    return {
        "message":        "Donation claimed successfully",
        "donation":       donation,
        "recommendation": recommendation,
        "rec_message":    rec_message,
    }
 
 
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
