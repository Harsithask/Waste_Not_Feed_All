from pydantic import BaseModel, EmailStr
from typing import Optional
 
 
class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    # role is NOT required — backend auto-detects from donors/ngos/volunteers tables
 
 
class DonorRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: Optional[str] = "Not provided"
    password: str
 
 
class NGORegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
 
    organization_name: str
    registration_number: str
    government_id: Optional[str] = None      # auto-filled from registration_number
 
    address: Optional[str] = "Not provided"
    city: str
    state: Optional[str] = ""
 
    document_url: Optional[str] = ""
 
    password: str
 
 
class VolunteerRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    city: str
    password: str