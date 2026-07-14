from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# pyrefly: ignore [missing-import]
from app.database import get_db
# pyrefly: ignore [missing-import]
from app.services import db_service
# pyrefly: ignore [missing-import]
from app.services.auth_service import get_current_user
# pyrefly: ignore [missing-import]
from app.schemas.interaction import InteractionCreate, InteractionUpdate, InteractionResponse
# pyrefly: ignore [missing-import]
from app.agent.tools.weekly_summary import weekly_summary_tool

router = APIRouter(prefix="/interaction", tags=["Interactions"])

@router.post("", response_model=InteractionResponse, status_code=status.HTTP_201_CREATED)
def create_interaction(
    interaction_data: InteractionCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Log a new interaction with a doctor.
    Creates doctor if they do not exist.
    """
    try:
        interaction = db_service.create_interaction(db, interaction_data)
        return interaction
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create interaction: {str(e)}"
        )

@router.put("/{id}", response_model=InteractionResponse)
def update_interaction(
    id: int,
    interaction_data: InteractionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update details of an existing interaction.
    """
    interaction = db_service.update_interaction(db, id, interaction_data)
    if not interaction:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Interaction record with ID {id} not found."
        )
    return interaction

@router.get("", response_model=List[InteractionResponse])
def get_interactions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve all logged doctor interactions, ordered by most recent.
    """
    return db_service.get_interactions(db)

# Note: The instructions specify separate endpoint patterns:
# GET /summary
# GET /followups
# We expose them here but with their requested paths relative to root or within this router.
# Let's write them relative to root in another router or register them on root in app.py,
# or we can define them here. Let's write them in this file but register them correctly.
# To match exactly:
# GET /summary
# GET /followups
# We can register them on a root-level router or in app.py directly.
# Let's put GET /summary and GET /followups in this file but with a clean path or register them under a separate router.
# Actually, the path is GET /summary and GET /followups. Let's create a separate router for them,
# or keep them here and register them without the prefix `/interaction`.
# That's very easy: we can create a root-level router in this file or a separate file.
# Let's create a separate router or expose them directly without prefix by creating them in a separate router.
# Let's write them in a file called router_misc.py or expose them directly in app.py, or define a root router.
# Let's define them in a file `routers/misc.py` for `/summary` and `/followups`.
# That is very clean and matches the endpoint patterns exactly!
