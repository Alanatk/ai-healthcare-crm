from sqlalchemy.orm import Session
from app.services import db_service
from app.schemas.interaction import InteractionCreate

def log_interaction_tool(db: Session, args: dict) -> dict:
    """
    Log a new doctor interaction in the database.
    Required args: doctor_name, hospital, summary
    Optional args: products, followup_date, notes
    """
    doctor_name = args.get("doctor_name")
    hospital = args.get("hospital")
    summary = args.get("summary")
    products = args.get("products")
    followup_date = args.get("followup_date")
    notes = args.get("notes", "")

    if not doctor_name or not hospital or not summary:
        return {"error": "Missing required fields: doctor_name, hospital, and summary are required."}

    obj_in = InteractionCreate(
        doctor_name=doctor_name,
        hospital=hospital,
        summary=summary,
        products=products,
        followup_date=followup_date,
        notes=notes
    )

    interaction = db_service.create_interaction(db, obj_in)
    return {
        "success": True,
        "message": f"Successfully logged interaction with {doctor_name} at {hospital}.",
        "data": {
            "id": interaction.id,
            "doctor_name": doctor_name,
            "hospital": hospital,
            "products": products,
            "summary": summary,
            "followup_date": followup_date,
            "notes": notes
        }
    }
