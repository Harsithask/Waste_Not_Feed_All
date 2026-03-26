from fastapi import APIRouter, HTTPException
from app.database import supabase
from pydantic import BaseModel
from datetime import datetime
from app.routers.notifications import create_notification

router = APIRouter()  # prefix="/volunteer" is set in main.py


# ══════════════════════════════════════════════════════════
#  ROUTE ORDER: Fixed-segment paths BEFORE path-param routes
# ══════════════════════════════════════════════════════════

class AssignRequest(BaseModel):
    volunteer_id: str

class StatusUpdate(BaseModel):
    status: str
    volunteer_id: str


# ══════════════════════════════════════════════════════════
# GET /volunteer/profile/email/{email}
# ══════════════════════════════════════════════════════════
@router.get("/profile/email/{email}")
def get_volunteer_profile_by_email(email: str):
    try:
        result = (
            supabase.table("volunteers")
            .select("*")
            .eq("email", email)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# GET /volunteer/profile/{volunteer_id}
# ══════════════════════════════════════════════════════════
@router.get("/profile/{volunteer_id}")
def get_volunteer_profile_by_id(volunteer_id: str):
    try:
        result = (
            supabase.table("volunteers")
            .select("*")
            .eq("id", volunteer_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# PUT /volunteer/profile/{volunteer_id}
# ══════════════════════════════════════════════════════════
@router.put("/profile/{volunteer_id}")
def update_volunteer_profile(volunteer_id: str, data: dict):
    allowed = {"name", "phone", "city"}
    update_data = {k: v for k, v in data.items() if k in allowed and v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    try:
        result = (
            supabase.table("volunteers")
            .update(update_data)
            .eq("id", volunteer_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Volunteer not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# GET /volunteer/notifications/{volunteer_id}
# ══════════════════════════════════════════════════════════
@router.get("/notifications/{volunteer_id}")
def get_notifications(volunteer_id: str):
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
# PUT /volunteer/notifications/{notification_id}/read
# ══════════════════════════════════════════════════════════
@router.put("/notifications/{notification_id}/read")
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
# GET /volunteer/donations/available
# ══════════════════════════════════════════════════════════
@router.get("/donations/available")
def get_available_donations():
    try:
        result = (
            supabase.table("donations")
            .select("*")
            .eq("status", "available")
            .execute()
        )
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# GET /volunteer/donations/ngo-assigned/{volunteer_id}
# ══════════════════════════════════════════════════════════
@router.get("/donations/ngo-assigned/{volunteer_id}")
def get_ngo_assigned_donations(volunteer_id: str):
    try:
        result = (
            supabase.table("donations")
            .select("*")
            .eq("volunteer_id", volunteer_id)
            .eq("status", "assigned")
            .execute()
        )
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# GET /volunteer/donations/assigned/{volunteer_id}
# ══════════════════════════════════════════════════════════
@router.get("/donations/assigned/{volunteer_id}")
def get_assigned_donations(volunteer_id: str):
    try:
        result = (
            supabase.table("donations")
            .select("*")
            .eq("volunteer_id", volunteer_id)
            .execute()
        )
        return result.data or []
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# GET /volunteer/stats/{volunteer_id}
# ══════════════════════════════════════════════════════════
@router.get("/stats/{volunteer_id}")
def get_volunteer_stats(volunteer_id: str):
    try:
        result = (
            supabase.table("donations")
            .select("*")
            .eq("volunteer_id", volunteer_id)
            .execute()
        )
        donations = result.data or []
        return {
            "total_tasks":     len(donations),
            "completed_tasks": len([d for d in donations if d.get("status") == "delivered"]),
            "active_tasks":    len([d for d in donations if d.get("status") in ["assigned", "picked_up"]]),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# POST /volunteer/donations/{donation_id}/assign
# Volunteer self-assigns an available donation
# ══════════════════════════════════════════════════════════
@router.post("/donations/{donation_id}/assign")
def assign_donation(donation_id: int, request: AssignRequest):
    try:
        check = (
            supabase.table("donations")
            .select("id, status, claimed_by, name, pickup_location")
            .eq("id", donation_id)
            .execute()
        )
        if not check.data:
            raise HTTPException(status_code=404, detail="Donation not found")

        current_status = check.data[0].get("status", "")
        if current_status.lower() != "available":
            raise HTTPException(
                status_code=400,
                detail=f"Donation is no longer available (current status: {current_status})"
            )

        result = (
            supabase.table("donations")
            .update({
                "status":       "assigned",
                "volunteer_id": request.volunteer_id,
                "updated_at":   datetime.utcnow().isoformat()
            })
            .eq("id", donation_id)
            .execute()
        )

        # ── Notify NGO that a volunteer accepted ──────────────
        don = check.data[0]
        ngo_id = don.get("claimed_by")
        if ngo_id:
            create_notification(
                type="volunteer_accepted",
                message=f"A volunteer has accepted the pickup for '{don.get('name', '')}'.",
                donation_id=donation_id,
                donation_name=don.get("name", ""),
                pickup_location=don.get("pickup_location", ""),
                ngo_id=ngo_id,
            )

        return {"message": "Donation assigned successfully", "data": result.data}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ══════════════════════════════════════════════════════════
# PUT /volunteer/donations/{donation_id}/status
# Volunteer updates pickup/delivery status
# ══════════════════════════════════════════════════════════
@router.put("/donations/{donation_id}/status")
def update_donation_status(donation_id: int, data: StatusUpdate):
    VALID_STATUSES = {"picked_up", "delivered"}
    if data.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{data.status}'. Must be one of: {VALID_STATUSES}"
        )

    try:
        # 1. Verify donation exists
        check = (
            supabase.table("donations")
            .select("id, volunteer_id, status")
            .eq("id", donation_id)
            .execute()
        )
        if not check.data:
            raise HTTPException(status_code=404, detail="Donation not found")

        # 2. Build update payload
        update_data = {
            "status":     data.status,
            "updated_at": datetime.utcnow().isoformat()
        }
        if data.status == "picked_up":
            update_data["picked_up_at"] = datetime.utcnow().isoformat()
        elif data.status == "delivered":
            update_data["delivered_at"] = datetime.utcnow().isoformat()

        # 3. Update in Supabase
        supabase.table("donations") \
            .update(update_data) \
            .eq("id", donation_id) \
            .execute()

        # 4. Re-fetch full record for notification fields
        updated = (
            supabase.table("donations")
            .select("*")
            .eq("id", donation_id)
            .execute()
        )
        if not updated.data:
            raise HTTPException(status_code=404, detail="Donation data lost during update")

        don          = updated.data[0]
        ngo_id_val   = don.get("claimed_by")
        donor_id_val = don.get("donor_id")
        vol_id_val   = don.get("volunteer_id")   # ← FIX: use actual volunteer_id, never None
        don_name     = don.get("name", "Food Item")
        pickup_loc   = don.get("pickup_location", "")

        # 5. Notifications
        if data.status == "picked_up":
            # Notify NGO: volunteer is on the way
            if ngo_id_val:
                create_notification(
                    type="food_collected",
                    message=f"Volunteer has collected '{don_name}' and is on the way.",
                    donation_id=donation_id,
                    donation_name=don_name,
                    pickup_location=pickup_loc,
                    ngo_id=ngo_id_val,
                    volunteer_id=vol_id_val,   # ← FIX: pass real value
                )

        elif data.status == "delivered":
            # Notify NGO: delivery complete
            if ngo_id_val:
                create_notification(
                    type="delivery_completed",
                    message=f"'{don_name}' has been delivered to your center.",
                    donation_id=donation_id,
                    donation_name=don_name,
                    pickup_location=pickup_loc,
                    ngo_id=ngo_id_val,
                    volunteer_id=vol_id_val,   # ← FIX: pass real value
                )
            # Notify Donor: their food reached someone
            if donor_id_val:
                create_notification(
                    type="delivery_completed",
                    message=f"Your donation '{don_name}' has been delivered successfully! 🎉",
                    donation_id=donation_id,
                    donation_name=don_name,
                    pickup_location=pickup_loc,
                    donor_id=donor_id_val,
                    volunteer_id=vol_id_val,   # ← FIX: pass real value
                )

        return {
            "status":   "success",
            "message":  f"Donation status updated to '{data.status}'",
            "donation": don,
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"CRITICAL ERROR in update_donation_status: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal Server Error during status update")


# ══════════════════════════════════════════════════════════
# GET /volunteer/donations/{donation_id}
# Single donation — path param, must be LAST
# ══════════════════════════════════════════════════════════
@router.get("/donations/{donation_id}")
def get_donation_details(donation_id: int):
    try:
        result = (
            supabase.table("donations")
            .select("*")
            .eq("id", donation_id)
            .execute()
        )
        if not result.data:
            raise HTTPException(status_code=404, detail="Donation not found")
        return result.data[0]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))