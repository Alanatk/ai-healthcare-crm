from sqlalchemy.orm import Session
from app.services import db_service

def today_followups_tool(db: Session, args: dict = None) -> dict:
    """
    Return today's and pending follow-ups.
    """
    followups = db_service.get_today_followups(db)
    
    if not followups:
        return {
            "success": True,
            "message": "You have no pending follow-ups scheduled.",
            "data": []
        }

    data = []
    for f in followups:
        data.append({
            "id": f.id,
            "doctor_name": f.doctor.doctor_name,
            "hospital": f.doctor.hospital,
            "followup_date": f.followup_date,
            "summary": f.summary
        })

    return {
        "success": True,
        "message": f"You have {len(data)} pending follow-up meetings scheduled.",
        "data": data
    }
