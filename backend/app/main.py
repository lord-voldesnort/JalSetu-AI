from fastapi import FastAPI
from app.config import settings
from app.schemas.health import HealthResponse

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="JalSetu AI - Climate-resilience copilot for agriculture API",
    version="0.1.0",
)


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
    )
