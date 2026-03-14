from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.database import supabase
 
router = APIRouter(
    prefix="/ngo",
    tags=["NGO"],
)
 
 
# ── Schemas ────────────────────────────────────────────────
class EventCreate(BaseModel):
    ngo_id:      str
    title:       str
    location:    str
    event_date:  str
    description: Optional[str] = None
 
 
class AssignVolunteerRequest(BaseModel):
    event_id:         str
    volunteer_id:     str
    task_description: Optional[str] = None
 
 
# ══════════════════════════════════════════════════════════
#  GET /ngo/events/active  — all non-completed events
#  ⚠️  Must be declared BEFORE /ngo/events/:ngo_id
#      to avoid "active" being matched as an ngo_id
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
 
 
# ══════════════════════════════════════════════════════════
#  GET /ngo/events/:ngo_id  — events for a specific NGO
# ══════════════════════════════════════════════════════════
@router.get("/events/{ngo_id}")
def get_ngo_events(ngo_id: str):
    result = (
        supabase.table("ngo_events")
        .select("*")
        .eq("ngo_id", ngo_id)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []
 
 
# ══════════════════════════════════════════════════════════
#  POST /ngo/events  — create a new event
# ══════════════════════════════════════════════════════════
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
 
 
# ══════════════════════════════════════════════════════════
#  PUT /ngo/events/:event_id/complete  — mark as completed
# ══════════════════════════════════════════════════════════
@router.put("/events/{event_id}/complete")
def complete_event(event_id: str):
    check = supabase.table("ngo_events").select("id").eq("id", event_id).execute()
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
 
 
# ══════════════════════════════════════════════════════════
#  DELETE /ngo/events/:event_id
# ══════════════════════════════════════════════════════════
@router.delete("/events/{event_id}")
def delete_event(event_id: str):
    check = supabase.table("ngo_events").select("id").eq("id", event_id).execute()
    if not check.data:
        raise HTTPException(status_code=404, detail="Event not found")
 
    supabase.table("ngo_events").delete().eq("id", event_id).execute()
    return {"message": "Event deleted successfully"}
 
 
# ══════════════════════════════════════════════════════════
#  POST /ngo/assign-volunteer
# ══════════════════════════════════════════════════════════
@router.post("/assign-volunteer")
def assign_volunteer(body: AssignVolunteerRequest):
    # Validate event exists
    ev = supabase.table("ngo_events").select("id").eq("id", body.event_id).execute()
    if not ev.data:
        raise HTTPException(status_code=404, detail="Event not found")
 
    # Validate volunteer exists
    vol = supabase.table("volunteers").select("id").eq("id", body.volunteer_id).execute()
    if not vol.data:
        raise HTTPException(status_code=404, detail="Volunteer not found")
 
    # Check for duplicate assignment
    dup = (
        supabase.table("volunteer_assignments")
        .select("id")
        .eq("event_id", body.event_id)
        .eq("volunteer_id", body.volunteer_id)
        .execute()
    )
    if dup.data:
        raise HTTPException(status_code=400, detail="Volunteer already assigned to this event")
 
    result = supabase.table("volunteer_assignments").insert({
        "event_id":         body.event_id,
        "volunteer_id":     body.volunteer_id,
        "task_description": body.task_description,
    }).execute()
 
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to assign volunteer")
 
    return {"message": "Volunteer assigned successfully", "assignment": result.data[0]}
 
 

@router.get("/volunteers-list")
def get_all_volunteers():
    result = supabase.table("volunteers").select("id, name, email, phone, city").execute()
    return result.data or []