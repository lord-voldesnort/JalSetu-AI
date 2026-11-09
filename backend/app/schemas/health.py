from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Overall system operational status")
    app: str = Field(default="JalSetu AI", description="Application name")
    environment: str = Field(default="development", description="Execution environment")
    version: str = Field(default="0.1.0", description="API version")
    database: str = Field(default="connected", description="Database connectivity status")

