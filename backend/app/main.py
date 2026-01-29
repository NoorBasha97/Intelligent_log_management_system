from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.database import Base, engine
from app.api.routes import (
    user_routes,
    auth_routes,
    team_routes,
    role_routes,
    file_routes,
    log_routes,
    audit_routes,
)
from app.api.routes.file_upload import router as file_router
from app.api.routes import dashboard_routes
# -------------------------
# Create FastAPI app
# -------------------------
app = FastAPI(
    title="Intelligent File & Log Management System",
    description="Secure, multi-tenant log ingestion and analysis backend",
    version="1.0.0",
)

# ✅ CORS configuration (ADD THIS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173","http://localhost:8000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Create DB tables (DEV only)
# -------------------------
# @app.on_event("startup")
# def on_startup():
#     """
#     Create tables on startup.
#     In production, use Alembic instead.
#     """
#     # In your engine setup or main.py
#     Base.metadata.drop_all(bind=engine)
#     Base.metadata.create_all(bind=engine)


# -------------------------
# Health check
# -------------------------
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "OK"}


# -------------------------
# Include API routes
# -------------------------
app.include_router(auth_routes.router)
app.include_router(user_routes.router)
app.include_router(team_routes.router)
app.include_router(role_routes.router)
app.include_router(file_routes.router)
app.include_router(log_routes.router)
app.include_router(audit_routes.router)
app.include_router(file_router)
app.include_router(dashboard_routes.router)