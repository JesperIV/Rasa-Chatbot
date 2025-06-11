import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import admin_routes

frontend_url = os.getenv("FRONTEND_URL", "http://localhost:4173")

app = FastAPI(title="Admin API")

origins = ["http://localhost:4173"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(admin_routes.router)