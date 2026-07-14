from pydantic import BaseModel
from typing import Optional
from datetime import datetime
# pyrefly: ignore [missing-import]
from app.schemas.doctor import DoctorResponse

class InteractionBase(BaseModel):
    summary: str
    notes: Optional[str] = None
    products: Optional[str] = None
    followup_date: Optional[str] = None

class InteractionCreate(InteractionBase):
    doctor_name: str
    hospital: str

class InteractionUpdate(BaseModel):
    doctor_name: Optional[str] = None
    hospital: Optional[str] = None
    summary: Optional[str] = None
    notes: Optional[str] = None
    products: Optional[str] = None
    followup_date: Optional[str] = None

class InteractionResponse(InteractionBase):
    id: int
    doctor_id: int
    doctor: DoctorResponse
    created_at: datetime

    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda dt: dt.isoformat()
        }
