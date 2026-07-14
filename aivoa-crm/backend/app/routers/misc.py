# pyrefly: ignore [missing-import]
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
from app.schemas.interaction import InteractionResponse
# pyrefly: ignore [missing-import]
from app.agent.tools.weekly_summary import weekly_summary_tool

router = APIRouter(tags=["Reporting & Tasks"])

@router.get("/summary")
def get_weekly_summary(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get AI compiled weekly executive summary of all doctor interactions.
    """
    result = weekly_summary_tool(db)
    if not result.get("success", False):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "Failed to generate weekly summary.")
        )
    return {"summary": result.get("summary")}

@router.get("/followups", response_model=List[InteractionResponse])
def get_pending_followups(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the list of all pending/today's follow-up interactions.
    """
    return db_service.get_today_followups(db)
