from pydantic import BaseModel
from typing import Optional

class VolunteerBase(BaseModel):
    name: str
    email: str
    phone: str
    city: str

class VolunteerCreate(VolunteerBase):
    password: str

class Volunteer(VolunteerBase):
    id: int
    is_active: bool = True
    created_at: Optional[str] = None

    class Config:
        from_attributes = True

class VolunteerStats(BaseModel):
    total_tasks: int
    completed_tasks: int
    active_tasks: int
    total_distance: Optional[float] = None