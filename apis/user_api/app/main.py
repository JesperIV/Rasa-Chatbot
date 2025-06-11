from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import exchanges, feedback
from shared.database import engine, Base
import os

Base.metadata.create_all(bind=engine)   #   Auto-create table if not exists

app = FastAPI(title="User API")

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:4173")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(exchanges.router)
app.include_router(feedback.router)