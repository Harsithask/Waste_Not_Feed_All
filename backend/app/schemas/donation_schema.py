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


class DonationResponse(DonationBase):
    id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True