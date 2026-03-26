from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class DonationBase(BaseModel):
    name: str
    type: str
    expiry: date
    pickup_location: str
    contact_no: str


class DonationCreate(DonationBase):
    pass


class DonationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    expiry: Optional[date] = None
    pickup_location: Optional[str] = None
    contact_no: Optional[str] = None
    status: Optional[str] = None
    claimed_by: Optional[str] = None  # Add this!

class DonationResponse(DonationBase):
    id: int
    status: str
    created_at: datetime
    claimed_by: Optional[str] = None  # Add this!

    class Config:
        from_attributes = True

class Donation(DonationBase):
    id: int
    status: str = "available"  # available, assigned, picked_up, delivered
    volunteer_id: Optional[int] = None
    assigned_at: Optional[datetime] = None
    picked_up_at: Optional[datetime] = None
    delivered_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True