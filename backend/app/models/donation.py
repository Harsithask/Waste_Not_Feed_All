from sqlalchemy import Column, Integer, String, Date, DateTime
from sqlalchemy.sql import func
from app.database import Base


class Donation(Base):
    __tablename__ = "donations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    type = Column(String)
    expiry = Column(Date)
    pickup_location = Column(String)
    contact_no = Column(String)
    status = Column(String, default="Available")
    created_at = Column(DateTime(timezone=True), server_default=func.now())