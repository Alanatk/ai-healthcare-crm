from sqlalchemy.orm import Session
from app.services import db_service
from app.schemas.interaction import InteractionUpdate
from app.models.interaction import Interaction
from app.models.doctor import Doctor

def edit_interaction_tool(db: Session, args: dict) -> dict:
    """
    Modify an existing interaction.
    Args can include: interaction_id, doctor_name, hospital, summary, products, followup_date, notes
    If interaction_id is missing, it will attempt to find the latest interaction for the doctor_name.
    """
    interaction_id = args.get("interaction_id")
    doctor_name = args.get("doctor_name")

    # If ID is missing, try to find the latest interaction with this doctor name
    if not interaction_id and doctor_name:
        latest = db.query(Interaction).join(Doctor).filter(
            Doctor.doctor_name.like(f"%{doctor_name}%")
        ).order_by(Interaction.created_at.desc()).first()
        if latest:
            interaction_id = latest.id
        else:
            return {"error": f"Could not find any recent interaction with a doctor named '{doctor_name}' to edit."}
    
    if not interaction_id:
        return {"error": "An interaction ID or doctor name is required to identify which record to edit."}

    # Prepare update object
    obj_in = InteractionUpdate(
        doctor_name=args.get("doctor_name"),
        hospital=args.get("hospital"),
        summary=args.get("summary"),
        notes=args.get("notes"),
        products=args.get("products"),
        followup_date=args.get("followup_date")
    )

    updated = db_service.update_interaction(db, interaction_id, obj_in)
    if not updated:
        return {"error": f"Interaction with ID {interaction_id} not found."}

    return {
        "success": True,
        "message": f"Successfully updated interaction ID {interaction_id}.",
        "data": {
            "id": updated.id,
            "doctor_name": updated.doctor.doctor_name,
            "hospital": updated.doctor.hospital,
            "products": updated.products,
            "summary": updated.summary,
            "followup_date": updated.followup_date,
            "notes": updated.notes
        }
    }
