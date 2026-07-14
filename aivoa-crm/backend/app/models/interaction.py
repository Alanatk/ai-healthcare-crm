from sqlalchemy import Column, Integer, String, Text, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Interaction(Base):
    __tablename__ = "interactions"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id"), nullable=False)
    summary = Column(Text, nullable=False)  # Purpose or overall outcome
    notes = Column(Text, nullable=True)     # Detailed meeting notes
    products = Column(String(255), nullable=True)  # Comma-separated list of products
    followup_date = Column(String(50), nullable=True)  # Follow-up date (as string YYYY-MM-DD or date text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    doctor = relationship("Doctor", back_populates="interactions")
