from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
import bcrypt
# pyrefly: ignore [missing-import]
from app.models.user import User
# pyrefly: ignore [missing-import]
from app.models.doctor import Doctor
# pyrefly: ignore [missing-import]
from app.models.interaction import Interaction
# pyrefly: ignore [missing-import]
from app.schemas.interaction import InteractionCreate, InteractionUpdate

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    # Handle checkpw with matching byte strings
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# pyrefly: ignore [missing-import]
def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, name: str, email: str, password: str):
    hashed = hash_password(password)
    user = User(name=name, email=email, hashed_password=hashed)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def get_or_create_doctor(db: Session, doctor_name: str, hospital: str) -> Doctor:
    # Look for exact doctor
    doctor = db.query(Doctor).filter(
        Doctor.doctor_name == doctor_name,
        Doctor.hospital == hospital
    ).first()
    if not doctor:
        doctor = Doctor(doctor_name=doctor_name, hospital=hospital)
        db.add(doctor)
        db.commit()
        db.refresh(doctor)
    return doctor

def create_interaction(db: Session, obj_in: InteractionCreate) -> Interaction:
    # 1. Get or create doctor
    doctor = get_or_create_doctor(db, obj_in.doctor_name, obj_in.hospital)
    
    # 2. Create interaction record
    interaction = Interaction(
        doctor_id=doctor.id,
        summary=obj_in.summary,
        notes=obj_in.notes,
        products=obj_in.products,
        followup_date=obj_in.followup_date
    )
    db.add(interaction)
    db.commit()
    db.refresh(interaction)
    return interaction

def update_interaction(db: Session, interaction_id: int, obj_in: InteractionUpdate) -> Interaction:
    interaction = db.query(Interaction).filter(Interaction.id == interaction_id).first()
    if not interaction:
        return None

    # Handle doctor update if needed
    if obj_in.doctor_name is not None or obj_in.hospital is not None:
        current_doctor = interaction.doctor
        new_name = obj_in.doctor_name if obj_in.doctor_name is not None else current_doctor.doctor_name
        new_hospital = obj_in.hospital if obj_in.hospital is not None else current_doctor.hospital
        
        # Re-associate with get_or_create doctor
        doctor = get_or_create_doctor(db, new_name, new_hospital)
        interaction.doctor_id = doctor.id

    # Update interaction attributes
    for field in ["summary", "notes", "products", "followup_date"]:
        value = getattr(obj_in, field)
        if value is not None:
            setattr(interaction, field, value)

    db.commit()
    db.refresh(interaction)
    return interaction

def get_interactions(db: Session):
    return db.query(Interaction).order_by(Interaction.created_at.desc()).all()

def get_today_followups(db: Session):
    # Today's date string YYYY-MM-DD
    # Let's return interactions where followup_date is set (we can return all follow-ups, ordered)
    # The frontend expects all pending follow-ups
    return db.query(Interaction).filter(
        Interaction.followup_date != None,
        Interaction.followup_date != ""
    ).order_by(Interaction.followup_date.asc()).all()

def get_weekly_interactions(db: Session):
    # Retrieve meetings from the last 7 days
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    return db.query(Interaction).filter(Interaction.created_at >= one_week_ago).all()

def seed_database(db: Session):
    # 1. Seed default user if not exists
    default_email = "agent@aivoa.ai"
    user = get_user_by_email(db, default_email)
    if not user:
        create_user(db, "Sarah Jenkins", default_email, "password123")
        
        # 2. Seed some demo doctors & interactions to populate dashboard on first load
        doc1 = get_or_create_doctor(db, "Dr. Thomas", "Metro Diabetes Care Center")
        doc2 = get_or_create_doctor(db, "Dr. Clara Rose", "St. Jude Cardiology Clinic")
        
        # Interaction 1
        int1 = Interaction(
            doctor_id=doc1.id,
            summary="Discussed new insulin therapies. Dr. Thomas showed interest in trials.",
            notes="Doctor asked for brochures on Glucagon-like peptide-1 receptor agonists. Requesting a follow-up visit on next Monday.",
            products="Glucophage, Novolog",
            followup_date=(datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            created_at=datetime.utcnow() - timedelta(days=1)
        )
        db.add(int1)

        # Interaction 2
        int2 = Interaction(
            doctor_id=doc2.id,
            summary="Presented the clinical safety outcomes of the new heart valve product range.",
            notes="Very positive feedback. She wants a sample device sent to her clinic.",
            products="CoreValve, Evolut PRO",
            followup_date=datetime.now().strftime("%Y-%m-%d"), # Today
            created_at=datetime.utcnow()
        )
        db.add(int2)
        
        db.commit()
