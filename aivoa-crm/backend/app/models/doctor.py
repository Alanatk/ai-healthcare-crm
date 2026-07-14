from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    doctor_name = Column(String(100), nullable=False)
    hospital = Column(String(200), nullable=False)

    # Relationships
    interactions = relationship("Interaction", back_populates="doctor", cascade="all, delete-orphan")
