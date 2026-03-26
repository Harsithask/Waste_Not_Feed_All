import math
import re
from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
from app.routers.notifications import create_notification
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(
    prefix="/donations",
    tags=["Donations"],
)


# ── Schemas ────────────────────────────────────────────────
class DonationCreate(BaseModel):
    name: str
    type: Optional[str] = None
    pickup_location: Optional[str] = None
    contact_no: Optional[str] = None
    expiry: Optional[str] = None
    quantity: Optional[int] = None
    description: Optional[str] = None
    donor_name: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    status: Optional[str] = "available"
    claimed_by: Optional[str] = None
    # ✅ FIX: added donor_id so notifications can reach the donor
    donor_id: Optional[str] = None


class ClaimRequest(BaseModel):
    ngo_id: str


class DonorProfileUpdate(BaseModel):
    name:    Optional[str] = None
    phone:   Optional[str] = None
    address: Optional[str] = None


KNOWN_DISTRICTS = [
    "Coimbatore", "Erode", "Tiruppur", "Nilgiris",
    "Salem", "Dindigul", "Namakkal", "Karur",
]

TYPE_LABELS = {
    "homeless_shelter":   "Homeless Shelter",
    "orphanage":          "Orphanage",
    "old_age_home":       "Old Age Home",
    "community_kitchen":  "Community Kitchen",
    "slum_settlement":    "Slum Settlement",
    "ngo_distribution":   "NGO / Community Hall",
    "govt_welfare":       "Govt Welfare Centre",
    "low_income_housing": "Low Income Housing",
}


def extract_district(text: str) -> Optional[str]:
    if not text:
        return None
    for district in KNOWN_DISTRICTS:
        if re.search(rf"\b{district}\b", text, re.IGNORECASE):
            return district
    return None


def haversine(lat1, lng1, lat2, lng2) -> float:
    R = 6371
    d_lat = math.radians(lat2 - lat1)
    d_lng = math.radians(lng2 - lng1)
    a = (
        math.sin(d_lat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(d_lng / 2) ** 2
    )
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def get_recommended_spot(donation: dict) -> Optional[dict]:
    try:
        res   = supabase.table("red_spots").select("*").execute()
        spots = res.data or []
        if not spots:
            return None

        address_text = (
            str(donation.get("pickup_location") or "")
            + " "
            + str(donation.get("address") or "")
        )
        district = extract_district(address_text)
        if district:
            district_spots = [
                s for s in spots
                if s.get("city", "").strip().lower() == district.lower()
            ]
            if district_spots:
                spot = district_spots[0]
                spot["distance_km"] = None
                return spot

        don_lat = donation.get("latitude")
        don_lng = donation.get("longitude")
        if don_lat and don_lng:
            nearest = min(
                spots,
                key=lambda s: haversine(
                    float(don_lat), float(don_lng),
                    float(s["latitude"]), float(s["longitude"]),
                ),
            )
            nearest["distance_km"] = round(
                haversine(
                    float(don_lat), float(don_lng),
                    float(nearest["latitude"]), float(nearest["longitude"]),
                ), 1,
            )
            return nearest

        return spots[0]
    except Exception:
        return None


# ══════════════════════════════════════════════════════════
# GET /donations/donor/profile/{donor_id}
# ══════════════════════════════════════════════════════════
@router.get("/donor/profile/{donor_id}")
def get_donor_profile(donor_id: str):
    if not donor_id or donor_id in ("null", "undefined", ""):
        raise HTTPException(status_code=400, detail="Valid donor_id is required")
    result = (
        supabase.table("donors")
        .select("id, name, email, phone, address, created_at")
        .eq("id", donor_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Donor not found")
    return result.data[0]


# ══════════════════════════════════════════════════════════
# PUT /donations/donor/profile/{donor_id}
# ══════════════════════════════════════════════════════════
@router.put("/donor/profile/{donor_id}")
def update_donor_profile(donor_id: str, body: DonorProfileUpdate):
    if not donor_id or donor_id in ("null", "undefined", ""):
        raise HTTPException(status_code=400, detail="Valid donor_id is required")
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = (
        supabase.table("donors")
        .update(updates)
        .eq("id", donor_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")
    return result.data[0]


# ══════════════════════════════════════════════════════════
# GET /donations/available
# ══════════════════════════════════════════════════════════
@router.get("/available")
def get_available_donations():
    result = (
        supabase.table("donations")
        .select("*")
        .eq("status", "available")
        .is_("claimed_by", "null")
        .execute()
    )
    return result.data or []


# ══════════════════════════════════════════════════════════
# GET /donations/claims/{ngo_id}
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
# GET /donations
# ══════════════════════════════════════════════════════════
@router.get("/")
def get_all_donations():
    result = (
        supabase.table("donations")
        .select("*")
        .order("id", desc=True)
        .execute()
    )
    return result.data or []


# ══════════════════════════════════════════════════════════
# POST /donations — donor creates a new donation
# ══════════════════════════════════════════════════════════
@router.post("/")
def create_donation(donation: DonationCreate):
    result = (
        supabase.table("donations")
        .insert(donation.model_dump(exclude_none=True))
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create donation")

    new_donation = result.data[0]
    donation_id  = new_donation.get("id")

    # ── Notify NGOs in same city ───────────────────────────
    try:
        donor_city = extract_district(str(donation.pickup_location or ""))
        ngos_res   = supabase.table("ngos").select("id, city, address").execute()
        all_ngos   = ngos_res.data or []
        notified   = 0
        for ngo in all_ngos:
            ngo_city = ngo.get("city") or extract_district(str(ngo.get("address") or ""))
            if ngo_city and donor_city and ngo_city.lower() == donor_city.lower():
                create_notification(
                    type="new_donation",
                    message=f"New donation available in {donor_city}: {donation.name}",
                    donation_id=donation_id,
                    donation_name=donation.name,
                    pickup_location=donation.pickup_location,
                    quantity=str(donation.quantity or ""),
                    ngo_id=ngo["id"],
                )
                notified += 1
        print(f"✅ Notified {notified} NGOs in {donor_city} about new donation")
    except Exception as e:
        print(f"⚠️ NGO notification failed (non-critical): {e}")

    return new_donation


# ══════════════════════════════════════════════════════════
# PUT /donations/{donation_id}/claim — NGO claims a donation
# ══════════════════════════════════════════════════════════
@router.put("/{donation_id}/claim")
def claim_donation(donation_id: int, body: ClaimRequest):
    check = (
        supabase.table("donations")
        .select("*")
        .eq("id", donation_id)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Donation not found")
    if check.data[0].get("claimed_by"):
        raise HTTPException(status_code=400, detail="Donation has already been claimed")

    current_status = str(check.data[0].get("status", "")).lower()
    if current_status != "available":
        raise HTTPException(status_code=400, detail="Donation is no longer available")

    result = (
        supabase.table("donations")
        .update({
            "status":     "claimed",
            "claimed_by": body.ngo_id,
            "updated_at": "now()"
        })
        .eq("id", donation_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to claim donation")

    donation   = result.data[0]
    spot       = get_recommended_spot(donation)
    rec_message = None

    if spot:
        type_label = TYPE_LABELS.get(spot.get("type", ""), "Need Point")
        if spot.get("distance_km") is not None:
            rec_message = (
                f"📍 Deliver to {spot['place_name']} ({type_label}) — "
                f"{spot['city']} | ~{spot['distance_km']} km from pickup"
            )
        else:
            rec_message = (
                f"📍 Deliver to {spot['place_name']} ({type_label}) — "
                f"{spot['city']}. Deliver food here!"
            )

    # ── Notify donor their donation was claimed ────────────
    # ✅ FIX: donor_id is now saved in the donations row, so this will work
    try:
        donor_id_val = donation.get("donor_id")
        if donor_id_val:
            create_notification(
                type="donation_accepted",
                message=f"Your donation '{donation.get('name', '')}' has been accepted by an NGO! 🎉",
                donation_id=donation_id,
                donation_name=donation.get("name", ""),
                pickup_location=donation.get("pickup_location", ""),
                donor_id=donor_id_val,
            )
            print(f"✅ Donor {donor_id_val} notified: donation claimed by NGO")
        else:
            print("⚠️ donor_id missing on donation — skipping donor claim notification")
    except Exception as e:
        print(f"⚠️ Donor claim notification failed (non-critical): {e}")

    return {
        "message":        "Donation claimed successfully",
        "donation":       donation,
        "recommendation": spot,
        "rec_message":    rec_message,
    }


# ══════════════════════════════════════════════════════════
# PUT /donations/{donation_id}/assign-volunteer
# ══════════════════════════════════════════════════════════
@router.put("/{donation_id}/assign-volunteer")
def assign_donation_to_volunteer(donation_id: int, data: dict = Body(...)):
    volunteer_id = data.get("volunteer_id")
    if not volunteer_id:
        raise HTTPException(status_code=400, detail="Missing volunteer_id")

    donation_res = (
        supabase.table("donations")
        .select("id, name, claimed_by, volunteer_id, pickup_location, quantity")
        .eq("id", donation_id)
        .execute()
    )
    if not donation_res.data:
        raise HTTPException(status_code=404, detail="Donation not found")

    donation = donation_res.data[0]

    if not donation.get("claimed_by"):
        raise HTTPException(
            status_code=400,
            detail="Donation must be claimed by an NGO before assigning a volunteer"
        )

    vol_res = (
        supabase.table("volunteers")
        .select("id, name, email")
        .eq("id", volunteer_id)
        .execute()
    )
    if not vol_res.data:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    volunteer = vol_res.data[0]

    result = (
        supabase.table("donations")
        .update({
            "volunteer_id": volunteer_id,
            "status":       "assigned",
            "updated_at":   "now()"
        })
        .eq("id", donation_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to assign volunteer")

    # ── Email notification to volunteer ───────────────────
    try:
        from app.utils.email_utils import send_assignment_email
        send_assignment_email(
            volunteer_email=volunteer.get("email", ""),
            volunteer_name=volunteer.get("name", "Volunteer"),
            donation_name=donation.get("name", ""),
            pickup_location=donation.get("pickup_location", ""),
            quantity=str(donation.get("quantity", "")),
        )
    except Exception as e:
        print(f"⚠️ Email notification failed (non-critical): {e}")

    # ── In-app notification to volunteer ──────────────────
    create_notification(
        type="task_assigned",
        message=f"You have been assigned a new food pickup task: '{donation.get('name', '')}'.",
        donation_id=donation_id,
        donation_name=donation.get("name", ""),
        pickup_location=donation.get("pickup_location", ""),
        quantity=str(donation.get("quantity", "")),
        volunteer_id=volunteer_id,
    )

    return {"message": "Volunteer assigned successfully", "data": result.data[0]}


# ══════════════════════════════════════════════════════════
# PUT /donations/{donation_id} — generic update
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
# DELETE /donations/{donation_id}
# ══════════════════════════════════════════════════════════
@router.delete("/{donation_id}")
def delete_donation(donation_id: int):
    check = (
        supabase.table("donations")
        .select("id")
        .eq("id", donation_id)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Donation not found")
    result = (
        supabase.table("donations")
        .delete()
        .eq("id", donation_id)
        .execute()
    )
    return {"message": "Donation deleted successfully"}