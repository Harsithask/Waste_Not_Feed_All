from pydantic import BaseModel, EmailStr

class LoginSchema(BaseModel):
    email: EmailStr
    password: str
    role: str


class DonorRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    address: str
    password: str


class NGORegister(BaseModel):
    name: str
    email: EmailStr
    phone: str

    organization_name: str
    registration_number: str
    government_id: str

    address: str
    city: str
    state: str

    document_url: str

    password: str


class VolunteerRegister(BaseModel):
    name: str
    email: EmailStr
    phone: str
    city: str
    password: str