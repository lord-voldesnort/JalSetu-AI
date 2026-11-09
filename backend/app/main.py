from fastapi import FastAPI
from app.config import settings
from app.schemas.health import HealthResponse
from app.routers import fields, forecast, scenario, water_plan, explain, events, metrics

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="JalSetu AI - Climate-resilience copilot for agriculture API",
    version="0.1.0",
)

app.include_router(fields.router)
app.include_router(forecast.router)
app.include_router(scenario.router)
app.include_router(water_plan.router)
app.include_router(explain.router)
app.include_router(events.router)
app.include_router(metrics.router)


@app.get("/health", response_model=HealthResponse)
def health_check() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service=settings.SERVICE_NAME,
    )
