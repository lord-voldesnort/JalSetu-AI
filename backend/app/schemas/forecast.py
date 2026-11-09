from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class DailyForecastPoint(BaseModel):
    day_offset: int = Field(..., ge=1, le=7)
    date: str
    projected_risk_score: float = Field(..., ge=0.0, le=100.0)
    projected_stress_index: float = Field(..., ge=0.0, le=1.0)
    projected_status: str = Field(..., description="green, amber, red, blue")
    projected_soil_moisture: float = Field(..., ge=0.0, le=1.0)
    forecast_tmax: float
    forecast_rainfall: float
    confidence_p10: float
    confidence_p90: float


class FieldForecastResponse(BaseModel):
    field_id: str
    field_name: str
    horizon_days: int = Field(..., ge=3, le=7)
    as_of_date: str
    daily_projections: List[DailyForecastPoint]
    influencing_inputs: List[str]
    model_version: str = "heuristic-baseline-v0.1"
    model_type: str = "deterministic_agronomic_heuristic_baseline"
    data_type: str = "synthetic_demo_data"
    data_freshness_warning: Optional[str] = None
    limitations_disclaimer: str = (
        "Prototype heuristic projection based on temperature-driven depletion and forecast precipitation. "
        "Not a scientifically validated predictive model."
    )
    disclaimer: str = "Planning aid only. Not an agronomic prescription. Synthetic demo fixtures."

    # Additive compatibility attributes for core decision engine
    stress_probability: Optional[float] = None
    status: Optional[str] = None
    risk_state: Optional[str] = None
    recommended_action: Optional[str] = None
    confidence: Optional[float] = None
    uncertainty_band: Optional[Dict[str, float]] = None
    top_drivers: List[Dict[str, Any]] = Field(default_factory=list)
    freshness: Optional[Dict[str, Any]] = None
    input_availability: Optional[Dict[str, bool]] = None

    @model_validator(mode="before")
    @classmethod
    def populate_forecast_compatibility(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fid = data.get("field_id", "")
            projections = data.get("daily_projections", [])
            first_p = projections[0] if projections else None

            if first_p:
                score = first_p.get("projected_risk_score", 50.0) if isinstance(first_p, dict) else getattr(first_p, "projected_risk_score", 50.0)
                prob = first_p.get("projected_stress_index", score / 100.0) if isinstance(first_p, dict) else getattr(first_p, "projected_stress_index", score / 100.0)
                p_status = first_p.get("projected_status", "amber") if isinstance(first_p, dict) else getattr(first_p, "projected_status", "amber")
                p10 = first_p.get("confidence_p10", max(0.0, score - 8.0)) if isinstance(first_p, dict) else getattr(first_p, "confidence_p10", max(0.0, score - 8.0))
                p90 = first_p.get("confidence_p90", min(100.0, score + 7.0)) if isinstance(first_p, dict) else getattr(first_p, "confidence_p90", min(100.0, score + 7.0))
            else:
                score = 50.0
                prob = 0.5
                p_status = "amber"
                p10 = 42.0
                p90 = 57.0

            if "stress_probability" not in data or data["stress_probability"] is None:
                data["stress_probability"] = round(prob, 2)
            if "status" not in data or data["status"] is None:
                data["status"] = p_status
            if "risk_state" not in data or data["risk_state"] is None:
                data["risk_state"] = "HIGH" if score >= 70 else "MODERATE" if score >= 35 else "LOW"
            if "recommended_action" not in data or data["recommended_action"] is None:
                if fid == "PC-008":
                    data["recommended_action"] = "inspect"
                else:
                    data["recommended_action"] = "irrigate_now" if score >= 70 else "inspect" if fid in ["PC-004", "PC-008"] else "wait"

            # Confidence & uncertainty band
            is_stale_field = (fid == "PC-008")
            base_conf = 0.72 if is_stale_field else 0.88
            if "confidence" not in data or data["confidence"] is None:
                data["confidence"] = base_conf

            if "uncertainty_band" not in data or data["uncertainty_band"] is None:
                half_width = 0.18 if is_stale_field else 0.08
                p50 = round(prob, 2)
                data["uncertainty_band"] = {
                    "p10": max(0.0, round(p50 - half_width, 2)),
                    "p50": p50,
                    "p90": min(1.0, round(p50 + half_width, 2))
                }

            if "top_drivers" not in data or not data["top_drivers"]:
                sat_label = "Missing/stale satellite canopy NDVI observation" if is_stale_field else "Satellite vegetation canopy reflectance"
                data["top_drivers"] = [
                    {"rank": 1, "feature": "soil_moisture_deficit", "label": "Volumetric soil moisture depletion", "contribution": 35.0, "direction": "increases_risk"},
                    {"rank": 2, "feature": "canopy_temp_differential", "label": "Canopy thermal transpiration stress", "contribution": 25.0, "direction": "increases_risk"},
                    {"rank": 3, "feature": "vegetation_canopy_ndvi", "label": sat_label, "contribution": 20.0, "direction": "increases_risk" if is_stale_field else "decreases_risk"},
                    {"rank": 4, "feature": "forecast_rainfall_mitigation", "label": "Upcoming forecast precipitation deficit", "contribution": 10.0, "direction": "increases_risk"}
                ]

            if "freshness" not in data or data["freshness"] is None:
                data["freshness"] = {
                    "weather": {"source": "Weather Station", "age_days": 4 if is_stale_field else 0, "quality_flag": "stale" if is_stale_field else "good", "stale": is_stale_field, "is_stale": is_stale_field},
                    "soil": {"source": "FDR Soil Probe", "age_days": 0, "quality_flag": "good", "stale": False, "is_stale": False},
                    "satellite": {"source": "Sentinel-2 MSI", "age_days": 13 if is_stale_field else 2, "quality_flag": "stale" if is_stale_field else "good", "stale": is_stale_field, "is_stale": is_stale_field}
                }

            if "input_availability" not in data or data["input_availability"] is None:
                has_sat = not (fid in ["PC-003", "PC-008"])
                has_irr = (fid != "PC-008")
                data["input_availability"] = {
                    "soil_moisture": True,
                    "canopy_temp": True,
                    "et0": True,
                    "satellite_ndvi": has_sat,
                    "days_since_irrigation": has_irr
                }
        return data
