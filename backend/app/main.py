import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.db.base import Base
from app.db.session import engine, SessionLocal
from app.db.seed import seed_database
from app.api.v1.router import api_router
from app.schemas.health import HealthResponse

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("jalsetu.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan context manager for startup and shutdown tasks."""
    logger.info("Initializing JalSetu AI database...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        summary = seed_database(db)
        logger.info(f"Database initialized and seeded: {summary}")
    except Exception as e:
        logger.error(f"Error during startup database seeding: {e}")
    finally:
        db.close()
    yield
    logger.info("JalSetu AI backend shutdown complete.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="JalSetu AI: Predictive Climate-Resilience Copilot for Agriculture",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS if isinstance(settings.CORS_ORIGINS, list) else [settings.CORS_ORIGINS],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root Healthcheck Endpoint
@app.get("/health", response_model=HealthResponse, tags=["Health"])
def root_health():
    """Root healthcheck endpoint returning standard HTTP 200 payload."""
    return HealthResponse(
        status="ok",
        app=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        version=settings.APP_VERSION,
        database="connected"
    )

# Root service greeting
@app.get("/", tags=["Root"])
def root_info():
    return {
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "description": "Predict water stress early. Prioritize scarce water. Protect crops.",
        "health": "/health",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

# Mount Versioned API Router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

# Also mount API router directly at root for direct root-path contract access (/fields, /water-plan, etc.)
app.include_router(api_router, prefix="")


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server error on {request.url.path}: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred in the JalSetu AI service.",
            "detail": str(exc) if settings.ENVIRONMENT == "development" else None
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=(settings.ENVIRONMENT == "development")
    )
