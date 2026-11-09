from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, model_validator
from app.schemas.field import FreshnessMeta
from app.schemas.forecast import ForecastResponse, UncertaintyBand


class ScenarioReplayRequest(BaseModel):
    field_id: str = Field(..., examples=["PC-001"], min_length=1)
    scenario_name: Optional[str] = Field(None, examples=["Moderate Heat Wave + Rainfall Deficit"])
    rainfall_multiplier: Optional[float] = Field(
        None,
        ge=0.0,
        le=5.0,
        description="Multiplier on baseline precipitation (e.g. 0.0 for complete drought, 1.0 for unchanged, 2.0 for 2x rain)",
        examples=[0.0],
    )
    delta_rainfall_mm: Optional[float] = Field(
        None,
        ge=-100.0,
        le=200.0,
        description="Additive change to precipitation in mm (e.g. -10.0 mm or +25.0 mm)",
        examples=[-5.0],
    )
    temperature_delta_c: Optional[float] = Field(
        None,
        ge=-10.0,
        le=15.0,
        description="Temperature anomaly in degrees Celsius (e.g. +4.0 C)",
        examples=[4.0],
    )
    heat_wave_intensity: Optional[Literal["mild", "moderate", "severe"]] = Field(
        None,
        description="Preset heat shock: mild (+2C), moderate (+4C), severe (+6C)",
        examples=["moderate"],
    )
    simulated_irrigation_mm: Optional[float] = Field(
        None,
        ge=0.0,
        le=100.0,
        description="Hypothetical irrigation applied in mm (e.g. 20.0 mm)",
        examples=[20.0],
    )
    horizon_days: Optional[int] = Field(
        default=7,
        ge=1,
        le=14,
        description="Forecast horizon in days (default 7)",
        examples=[7],
    )

    @model_validator(mode="after")
    def resolve_heat_intensity(self) -> "ScenarioReplayRequest":
        if self.heat_wave_intensity and self.temperature_delta_c is None:
            mapping = {"mild": 2.0, "moderate": 4.0, "severe": 6.0}
            self.temperature_delta_c = mapping[self.heat_wave_intensity]
        return self


class RiskProbabilityChange(BaseModel):
    baseline_probability: float = Field(..., examples=[0.15])
    scenario_probability: float = Field(..., examples=[0.48])
    probability_delta: float = Field(
        ...,
        examples=[0.33],
        description="scenario_probability - baseline_probability (positive means increased risk)",
    )
    baseline_status: str = Field(..., examples=["green"])
    scenario_status: str = Field(..., examples=["amber"])
    baseline_risk_state: str = Field(..., examples=["LOW"])
    scenario_risk_state: str = Field(..., examples=["MODERATE"])
    status_transition: str = Field(..., examples=["green -> amber"])
    risk_level_changed: bool = Field(..., examples=[True])


class ChangedDriver(BaseModel):
    feature: str = Field(..., examples=["rainfall_deficit"])
    baseline_contribution: float = Field(..., examples=[-0.18])
    scenario_contribution: float = Field(..., examples=[0.28])
    contribution_delta: float = Field(..., examples=[0.46])
    baseline_label: str = Field(..., examples=["Moderate rainfall (14.2 mm) offsets near-term demand"])
    scenario_label: str = Field(..., examples=["Zero precipitation (0.0 mm) simulated; deficit accumulating"])
    impact: str = Field(..., examples=["increased_risk"], description="increased_risk, reduced_risk, or neutral")


class ScenarioReplayResponse(BaseModel):
    field_id: str = Field(..., examples=["PC-001"])
    scenario_inputs: Dict[str, Any]
    baseline_forecast: ForecastResponse
    scenario_forecast: ForecastResponse
    change_summary: RiskProbabilityChange
    changed_drivers: List[ChangedDriver]
    input_availability: Dict[str, bool]
    freshness: Dict[str, FreshnessMeta]
    uncertainty: UncertaintyBand = Field(
        ...,
        description="Scenario forecast uncertainty band (p10, p50, p90)",
    )
    model_version: str = Field(default="heuristic-baseline-v0.1")
    model_type: str = Field(default="deterministic_agronomic_heuristic_baseline")
    data_type: str = Field(
        default="synthetic_demo_data",
        description="Explicitly marks response as synthetic demonstration data",
    )
    disclaimer: str = Field(
        default="Planning aid only — deterministic heuristic baseline using synthetic/replayed demonstration data. Not an agronomic prescription or trained ML model."
    )
    scenario_disclaimer: str = Field(
        default="Scenario simulation only — hypothetical what-if exploration for planning support. Does NOT guarantee real-world agricultural outcomes, yield improvements, or measured water savings."
    )
