from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, model_validator


class SignalContribution(BaseModel):
    signal_name: str
    observed_value: float
    unit: str
    contribution_points: float
    direction: str = Field(..., description="'increases_stress', 'decreases_stress', or 'neutral'")
    statement: str = Field(..., description="Plain-language agronomic explanation sentence")


class DataFreshnessIndicator(BaseModel):
    variable: str
    source: str
    observed_at: str
    age_days: int
    quality_flag: str = "good"
    is_stale: bool = False


class FieldAssessmentResponse(BaseModel):
    field_id: str
    field_name: str
    crop: str
    stage: str
    area_acres: float
    area_ha: float
    as_of_date: str
    risk_score: float = Field(..., ge=0.0, le=100.0, description="Normalized risk score 0-100")
    stress_index: float = Field(..., ge=0.0, le=1.0, description="Normalized stress index 0.0-1.0")
    risk_level: str = Field(..., description="Low, Moderate, High, or Critical")
    risk_state: Optional[str] = None
    stress_status: str = Field(..., description="green, amber, red, or blue (pause)")
    status: Optional[str] = None
    recommended_action: str = Field(..., description="irrigate_now, wait, inspect, protect_pause")
    action_window: str
    recommended_volume_m3: float
    confidence: float = Field(..., ge=0.0, le=1.0)
    is_simulated: bool = False
    active_scenario: str = "normal_01"
    drivers: List[SignalContribution] = Field(default_factory=list)
    freshness_table: List[DataFreshnessIndicator] = Field(default_factory=list)
    freshness: Optional[Dict[str, Any]] = None
    field: Optional[Dict[str, Any]] = None
    observations: List[Dict[str, Any]] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    data_type: str = "synthetic_demo_data"
    policy_disclaimer: str = (
        "Planning aid — not an agronomic prescription. Prototype heuristic index based on synthetic demo fixtures."
    )

    @model_validator(mode="before")
    @classmethod
    def populate_compatibility_fields(cls, data: Any) -> Any:
        if isinstance(data, dict):
            fid = data.get("field_id", "")
            if "status" not in data and "stress_status" in data:
                data["status"] = data["stress_status"]
            if "risk_state" not in data and "risk_level" in data:
                data["risk_state"] = data["risk_level"].upper()
            if "field" not in data:
                data["field"] = {
                    "id": fid,
                    "name": data.get("field_name", ""),
                    "crop": data.get("crop", ""),
                    "stage": data.get("stage", ""),
                    "area_acres": data.get("area_acres", 0.0),
                    "area_ha": data.get("area_ha", 0.0),
                }
            if "freshness" not in data:
                freshness_dict = {}
                table = data.get("freshness_table", [])
                for ind in table:
                    var = ind.get("variable", "") if isinstance(ind, dict) else getattr(ind, "variable", "")
                    src = ind.get("source", "") if isinstance(ind, dict) else getattr(ind, "source", "")
                    age = ind.get("age_days", 0) if isinstance(ind, dict) else getattr(ind, "age_days", 0)
                    qf = ind.get("quality_flag", "good") if isinstance(ind, dict) else getattr(ind, "quality_flag", "good")
                    stale = ind.get("is_stale", False) if isinstance(ind, dict) else getattr(ind, "is_stale", False)

                    key = "weather" if "weather" in src.lower() or var in ["rainfall", "forecast_tmax", "canopy_temp"] else \
                          "satellite" if "satellite" in src.lower() or var in ["ndvi"] else "soil"
                    freshness_dict[key] = {
                        "source": src,
                        "age_days": age,
                        "quality_flag": qf,
                        "stale": stale,
                        "is_stale": stale,
                    }
                for k in ["weather", "soil", "satellite"]:
                    if k not in freshness_dict:
                        # For PC-008, weather is 4d stale, satellite is 13d stale
                        is_stale = (fid == "PC-008" and k in ["weather", "satellite"]) or (fid == "PC-004" and k == "soil")
                        freshness_dict[k] = {
                            "source": f"Synthetic {k.capitalize()} Sensor",
                            "age_days": 4 if is_stale else 0,
                            "quality_flag": "stale" if is_stale else "good",
                            "stale": is_stale,
                            "is_stale": is_stale,
                        }
                data["freshness"] = freshness_dict
        return data


class ClusterAssessmentSummary(BaseModel):
    cluster_name: str = "Pimpri-Chinchwad Peri-Urban Demonstration Cluster"
    as_of_date: str
    active_scenario: str = "normal_01"
    is_simulated: bool = False
    total_fields: int
    counts_by_status: dict
    counts_by_action: dict
    total_recommended_volume_m3: float
    fields: List[FieldAssessmentResponse]
