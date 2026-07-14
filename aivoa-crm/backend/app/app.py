import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
# pyrefly: ignore [missing-import]
from app.database import engine, Base, SessionLocal
# pyrefly: ignore [missing-import]
from app.services.db_service import seed_database

load_dotenv()

# Initialize database tables on startup
Base.metadata.create_all(bind=engine)

# Seed database
db = SessionLocal()
try:
    seed_database(db)
finally:
    db.close()

# pyrefly: ignore [missing-import]
from app.routers import auth_router, interaction_router, misc_router, chat_router

app = FastAPI(
    title="AIVOA.AI CRM API",
    description="AI-First Healthcare Professional CRM Portal Backend",
    version="1.0.0"
)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth_router, prefix="/api")
app.include_router(interaction_router, prefix="/api")
app.include_router(misc_router, prefix="/api")
app.include_router(chat_router, prefix="/api")

@app.get("/")
def read_root():
    return {"status": "AIVOA.AI CRM API is online", "version": "1.0.0"}
