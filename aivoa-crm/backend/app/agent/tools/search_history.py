from sqlalchemy.orm import Session
from app.models.interaction import Interaction
from app.models.doctor import Doctor

def search_history_tool(db: Session, args: dict) -> dict:
    """
    Search and return previous interaction logs.
    Optional args: doctor_name
    """
    doctor_name = args.get("doctor_name")

    query = db.query(Interaction).join(Doctor)
    if doctor_name:
        query = query.filter(Doctor.doctor_name.like(f"%{doctor_name}%"))
    
    results = query.order_by(Interaction.created_at.desc()).limit(5).all()

    if not results:
        msg = f"No past interactions found for doctor '{doctor_name}'." if doctor_name else "No past interactions logged in the system."
        return {"success": True, "message": msg, "data": []}

    logs = []
    for r in results:
        logs.append({
            "id": r.id,
            "doctor_name": r.doctor.doctor_name,
            "hospital": r.doctor.hospital,
            "summary": r.summary,
            "products": r.products,
            "followup_date": r.followup_date,
            "date": r.created_at.strftime("%Y-%m-%d")
        })

    msg = f"Found {len(logs)} past interactions for '{doctor_name}':" if doctor_name else f"Found {len(logs)} recent interactions:"
    return {
        "success": True,
        "message": msg,
        "data": logs
    }
