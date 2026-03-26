import math
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import supabase

router = APIRouter(
    prefix="/ngo",
    tags=["NGO"],
)

# ──────────────────────────────────────────────────────────
# Schemas
# ──────────────────────────────────────────────────────────

class EventCreate(BaseModel):
    ngo_id: str
    title: str
    location: str
    event_date: str
    description: Optional[str] = None


class AssignVolunteerRequest(BaseModel):
    event_id: str
    volunteer_id: str
    task_description: Optional[str] = None


class RedSpotCreate(BaseModel):
    place_name: str
    type: str
    latitude: float
    longitude: float
    address: Optional[str] = None
    city: Optional[str] = "Coimbatore"

 
# ══════════════════════════════════════════════════════════
# NGO PROFILE
# ══════════════════════════════════════════════════════════
class NGOProfileUpdate(BaseModel):
    name:                Optional[str] = None
    phone:               Optional[str] = None
    organization_name:   Optional[str] = None
    registration_number: Optional[str] = None
    government_id:       Optional[str] = None
    address:             Optional[str] = None
    city:                Optional[str] = None
    state:               Optional[str] = None

# GET /ngo/profile/{ngo_id}
@router.get("/profile/{ngo_id}")
def get_ngo_profile(ngo_id: str):
    if not ngo_id or ngo_id in ("null", "undefined", ""):
        raise HTTPException(status_code=400, detail="Valid ngo_id is required")

    result = (
        supabase.table("ngos")
        .select("id, name, email, phone, organization_name, registration_number, government_id, address, city, state")
        .eq("id", ngo_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="NGO not found")

    return result.data[0]


# PUT /ngo/profile/{ngo_id}
@router.put("/profile/{ngo_id}")
def update_ngo_profile(ngo_id: str, body: NGOProfileUpdate):
    if not ngo_id or ngo_id in ("null", "undefined", ""):
        raise HTTPException(status_code=400, detail="Valid ngo_id is required")

    # Only update fields that were actually provided
    updates = {k: v for k, v in body.model_dump().items() if v is not None}

    if not updates:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = (
        supabase.table("ngos")
        .update(updates)
        .eq("id", ngo_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update profile")

    return result.data[0]


# ──────────────────────────────────────────────────────────
# Utility: Haversine Distance
# ──────────────────────────────────────────────────────────

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


# ══════════════════════════════════════════════════════════
# RED SPOTS
# ══════════════════════════════════════════════════════════

@router.get("/red-spots")
def get_red_spots():
    result = supabase.table("red_spots").select("*").execute()
    return result.data or []


@router.post("/red-spots")
def add_red_spot(spot: RedSpotCreate):
    result = supabase.table("red_spots").insert({
        "place_name": spot.place_name,
        "type":       spot.type,
        "latitude":   spot.latitude,
        "longitude":  spot.longitude,
        "address":    spot.address,
        "city":       spot.city,
        "added_by":   "user",
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to add red spot")

    return result.data[0]


@router.get("/recommend-spot/{donation_id}")
def recommend_spot(donation_id: int):
    donation_res = (
        supabase.table("donations")
        .select("id, name, pickup_location, latitude, longitude")
        .eq("id", donation_id)
        .execute()
    )

    if not donation_res.data:
        raise HTTPException(status_code=404, detail="Donation not found")

    donation = donation_res.data[0]
    don_lat  = donation.get("latitude")
    don_lng  = donation.get("longitude")

    spots_res = supabase.table("red_spots").select("*").execute()
    spots     = spots_res.data or []

    if not spots:
        return {"recommendation": None, "message": "No red spots found."}

    if don_lat and don_lng:
        for spot in spots:
            spot["distance_km"] = round(
                haversine(float(don_lat), float(don_lng),
                          float(spot["latitude"]), float(spot["longitude"])), 1
            )
        nearest = min(spots, key=lambda s: s["distance_km"])
        message = (
            f"📍 Deliver to {nearest['place_name']} "
            f"({nearest['type'].replace('_', ' ').title()}) — "
            f"~{nearest['distance_km']} km from pickup location"
        )
    else:
        nearest = spots[0]
        nearest["distance_km"] = None
        message = (
            f"📍 Suggested: {nearest['place_name']} "
            f"({nearest['type'].replace('_', ' ').title()}) "
            f"in {nearest.get('city', 'Coimbatore')}"
        )

    return {"recommendation": nearest, "donation": donation, "message": message}


# ══════════════════════════════════════════════════════════
# EVENTS
# CRITICAL: /events/active MUST be defined before /events/{ngo_id}
# otherwise FastAPI treats "active" as the ngo_id value
# ══════════════════════════════════════════════════════════

@router.get("/events/active")
def get_active_events():
    result = (
        supabase.table("ngo_events")
        .select("*")
        .neq("status", "completed")
        .execute()
    )
    return result.data or []


@router.get("/events/{ngo_id}")
def get_ngo_events(ngo_id: str):
    # Guard against null/undefined passed from frontend
    if not ngo_id or ngo_id in ("null", "undefined", ""):
        raise HTTPException(status_code=400, detail="Valid ngo_id is required")

    result = (
        supabase.table("ngo_events")
        .select("*")
        .eq("ngo_id", ngo_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


@router.post("/events")
def create_event(event: EventCreate):
    result = supabase.table("ngo_events").insert({
        "ngo_id":      event.ngo_id,
        "title":       event.title,
        "location":    event.location,
        "event_date":  event.event_date,
        "description": event.description,
        "status":      "upcoming",
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create event")

    return result.data[0]


@router.put("/events/{event_id}/complete")
def complete_event(event_id: str):
    check = (
        supabase.table("ngo_events")
        .select("id")
        .eq("id", event_id)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Event not found")

    result = (
        supabase.table("ngo_events")
        .update({"status": "completed"})
        .eq("id", event_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to update event")

    return {"message": "Event marked as completed"}


@router.delete("/events/{event_id}")
def delete_event(event_id: str):
    check = (
        supabase.table("ngo_events")
        .select("id")
        .eq("id", event_id)
        .execute()
    )
    if not check.data:
        raise HTTPException(status_code=404, detail="Event not found")

    supabase.table("ngo_events").delete().eq("id", event_id).execute()
    return {"message": "Event deleted successfully"}


# ══════════════════════════════════════════════════════════
# VOLUNTEER ASSIGNMENT
# ══════════════════════════════════════════════════════════

@router.post("/assign-volunteer")
def assign_volunteer(body: AssignVolunteerRequest):
    ev = (
        supabase.table("ngo_events")
        .select("id")
        .eq("id", body.event_id)
        .execute()
    )
    if not ev.data:
        raise HTTPException(status_code=404, detail="Event not found")

    vol = (
        supabase.table("volunteers")
        .select("id")
        .eq("id", body.volunteer_id)
        .execute()
    )
    if not vol.data:
        raise HTTPException(status_code=404, detail="Volunteer not found")

    dup = (
        supabase.table("volunteer_assignments")
        .select("id")
        .eq("event_id",     body.event_id)
        .eq("volunteer_id", body.volunteer_id)
        .execute()
    )
    if dup.data:
        raise HTTPException(
            status_code=400,
            detail="Volunteer already assigned to this event"
        )

    result = supabase.table("volunteer_assignments").insert({
        "event_id":         body.event_id,
        "volunteer_id":     body.volunteer_id,
        "task_description": body.task_description,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to assign volunteer")

    return {"message": "Volunteer assigned successfully", "assignment": result.data[0]}


# ══════════════════════════════════════════════════════════
# VOLUNTEER LIST
# ══════════════════════════════════════════════════════════

@router.get("/volunteers-list")
def get_all_volunteers():
    result = (
        supabase.table("volunteers")
        .select("id, name, email, phone, city")
        .execute()
    )
    return result.data or []