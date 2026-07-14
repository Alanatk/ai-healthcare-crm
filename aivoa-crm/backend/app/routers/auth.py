# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

# pyrefly: ignore [missing-import]
from app.database import get_db
# pyrefly: ignore [missing-import]
from app.services import db_service
# pyrefly: ignore [missing-import]
from app.services import auth_service
# pyrefly: ignore [missing-import]
from app.schemas.auth import LoginRequest, LoginResponse

router = APIRouter(tags=["Authentication"])

@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # 1. Fetch user from database
    user = db_service.get_user_by_email(db, login_data.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    # 2. Check hashed password
    if not db_service.verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )
    
    # 3. Create access token
    access_token = auth_service.create_access_token(data={"sub": user.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user
    }
