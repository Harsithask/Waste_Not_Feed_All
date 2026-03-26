from fastapi import APIRouter, HTTPException
from app.database import supabase

router = APIRouter(prefix="/notifications", tags=["Notifications"])


def create_notification(
    *,
    type: str,
    message: str,
    donation_id: int = None,
    donation_name: str = None,
    pickup_location: str = None,
    quantity: str = None,
    donor_id: str = None,
    ngo_id: str = None,
    volunteer_id: str = None,
):
    """
    Central helper — call this from any router to insert a notification row.
    Only pass the recipient fields that apply.
    Non-critical: exceptions are caught and printed, never raises.
    """
    try:
        payload = {
            "type":    type,
            "message": message,
            "is_read": False,
        }
        if donation_id:     payload["donation_id"]     = donation_id
        if donation_name:   payload["donation_name"]   = donation_name
        if pickup_location: payload["pickup_location"] = pickup_location
        if quantity:        payload["quantity"]        = str(quantity)
        if donor_id:        payload["donor_id"]        = donor_id
        if ngo_id:          payload["ngo_id"]          = ngo_id
        if volunteer_id:    payload["volunteer_id"]    = volunteer_id

        supabase.table("notifications").insert(payload).execute()
        print(f"✅ Notification [{type}] → donor={donor_id} ngo={ngo_id} vol={volunteer_id}")
    except Exception as e:
        print(f"⚠️ Notification insert failed (non-critical): {e}")


# ══════════════════════════════════════════════════════════
# GET /notifications/donor/{donor_id}
# ══════════════════════════════════════════════════════════
@router.get("/donor/{donor_id}")
def get_donor_notifications(donor_id: str):
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("donor_id", donor_id)
        .eq("is_read", False)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ══════════════════════════════════════════════════════════
# GET /notifications/ngo/{ngo_id}
# ══════════════════════════════════════════════════════════
@router.get("/ngo/{ngo_id}")
def get_ngo_notifications(ngo_id: str):
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("ngo_id", ngo_id)
        .eq("is_read", False)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ══════════════════════════════════════════════════════════
# GET /notifications/volunteer/{volunteer_id}
# ══════════════════════════════════════════════════════════
@router.get("/volunteer/{volunteer_id}")
def get_volunteer_notifications(volunteer_id: str):
    result = (
        supabase.table("notifications")
        .select("*")
        .eq("volunteer_id", volunteer_id)
        .eq("is_read", False)
        .order("created_at", desc=True)
        .execute()
    )
    return result.data or []


# ══════════════════════════════════════════════════════════
# PUT /notifications/{notification_id}/read
# ══════════════════════════════════════════════════════════
@router.put("/{notification_id}/read")
def mark_notification_read(notification_id: int):
    result = (
        supabase.table("notifications")
        .update({"is_read": True})
        .eq("id", notification_id)
        .execute()
    )
    if not result.data:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Marked as read"}


# ══════════════════════════════════════════════════════════
# PUT /notifications/mark-all-read
# Body: { "donor_id": "..." } OR { "ngo_id": "..." } OR { "volunteer_id": "..." }
# ══════════════════════════════════════════════════════════
@router.put("/mark-all-read")
def mark_all_read(body: dict):
    if "donor_id" in body:
        supabase.table("notifications").update({"is_read": True}).eq("donor_id", body["donor_id"]).execute()
    elif "ngo_id" in body:
        supabase.table("notifications").update({"is_read": True}).eq("ngo_id", body["ngo_id"]).execute()
    elif "volunteer_id" in body:
        supabase.table("notifications").update({"is_read": True}).eq("volunteer_id", body["volunteer_id"]).execute()
    else:
        raise HTTPException(status_code=400, detail="Provide donor_id, ngo_id, or volunteer_id")
    return {"message": "All marked as read"}