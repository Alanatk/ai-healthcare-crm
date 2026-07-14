from pydantic import BaseModel

class DoctorBase(BaseModel):
    doctor_name: str
    hospital: str

class DoctorCreate(DoctorBase):
    pass

class DoctorResponse(DoctorBase):
    id: int

    class Config:
        from_attributes = True
