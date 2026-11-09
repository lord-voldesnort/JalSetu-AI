"""
Deterministic agronomic heuristic baseline service for field-level water stress forecasting.

DISCLAIMER:
All predictions produced by this service use a deterministic, transparent
agronomic heuristic baseline over synthetic/cached demonstration data.
This does NOT represent a trained ML model, validated agricultural accuracy,
or an agronomic prescription.
"""

from typing import Dict, List, Optional
from app.data.fixtures import DEMO_FIELDS_RAW, DEMO_STATUS_RAW
from app.schemas.field import FreshnessMeta
from app.schemas.forecast import DriverResponse, ForecastResponse, UncertaintyBand

STAGE_SENSITIVITY_WEIGHTS: Dict[str, float] = {
    "Flowering": 0.10,
    "Fruiting": 0.08,
    "Bulb Development": 0.07,
    "Head Formation": 0.05,
    "Vegetative": 0.00,
    "Sowing": -0.05,
    "Harvesting": -0.10,
}

MODEL_VERSION = "heuristic-baseline-v0.1"
MODEL_TYPE = "deterministic_agronomic_heuristic_baseline"
DATA_TYPE = "synthetic_demo_data"
DEFAULT_HORIZON_DAYS = 7


def compute_field_forecast(field_id: str) -> Optional[ForecastResponse]:
    """
    Compute deterministic stress forecast for a specified field_id.
    Returns None if field_id is not in the demo registry.
    """
    field = next((f for f in DEMO_FIELDS_RAW if f["id"] == field_id), None)
    if not field:
        return None

    status_raw = DEMO_STATUS_RAW.get(field_id)
    if not status_raw:
        return None

    observations = status_raw.get("observations", [])
    freshness_raw = status_raw.get("freshness", {})

    # 1. Extract observations
    rain_obs = next((o for o in observations if o.get("variable") == "rainfall_mm"), None)
    ndvi_obs = next((o for o in observations if o.get("variable") == "ndvi"), None)
    soil_obs = next((o for o in observations if o.get("variable") == "soil_moisture_pct"), None)

    # 2. Extract freshness
    weather_fresh = freshness_raw.get("weather", {})
    sat_fresh = freshness_raw.get("satellite", {})
    soil_fresh = freshness_raw.get("soil", {})

    # 3. Check data availability & quality flags
    has_rain = (
        rain_obs is not None
        and rain_obs.get("value") is not None
        and rain_obs.get("quality_flag") != "MISSING"
    )
    rain_stale = bool(
        weather_fresh.get("stale", False) or weather_fresh.get("quality_flag") == "STALE"
    )

    has_ndvi = (
        ndvi_obs is not None
        and ndvi_obs.get("value") is not None
        and ndvi_obs.get("quality_flag") != "MISSING"
    )
    ndvi_quality = ndvi_obs.get("quality_flag", "GOOD") if ndvi_obs else "MISSING"
    sat_stale = bool(
        sat_fresh.get("stale", False)
        or sat_fresh.get("quality_flag") in ("STALE", "MISSING")
        or ndvi_quality in ("STALE", "MISSING")
    )
    sat_suspect = ndvi_quality == "SUSPECT"

    has_soil = (
        soil_obs is not None
        and soil_obs.get("value") is not None
        and soil_obs.get("quality_flag") != "MISSING"
    )
    soil_stale = bool(
        soil_fresh.get("stale", False) or soil_fresh.get("quality_flag") == "STALE"
    )

    input_availability = {
        "rainfall_observation": has_rain,
        "satellite_ndvi": has_ndvi,
        "soil_moisture_in_situ": has_soil,
        "crop_phenology": True,
        "days_since_irrigation": False,  # Not tracked in demo baseline
    }

    # 4. Compute agronomic heuristic components
    stage = field.get("stage", "Vegetative")
    stage_weight = STAGE_SENSITIVITY_WEIGHTS.get(stage, 0.0)

    # Base stress prior
    base_score = 0.38
    drivers: List[DriverResponse] = []

    # Rain component
    rain_val = rain_obs.get("value") if has_rain else None
    if has_rain and rain_val is not None:
        if rain_stale:
            # Stale weather data increases uncertainty
            rain_contrib = 0.12
            rain_dir = "increases_risk"
            rain_label = f"Recent rainfall recorded as {rain_val:.1f} mm, but observation is STALE ({weather_fresh.get('age_days', 4)} days old)"
        elif rain_val >= 20.0:
            rain_contrib = -0.28
            rain_dir = "decreases_risk"
            rain_label = f"Substantial precipitation ({rain_val:.1f} mm) replenishes soil moisture reserve"
        elif rain_val >= 10.0:
            rain_contrib = -0.18
            rain_dir = "decreases_risk"
            rain_label = f"Moderate rainfall ({rain_val:.1f} mm) offsets near-term evaporative demand"
        elif rain_val >= 5.0:
            rain_contrib = -0.08
            rain_dir = "decreases_risk"
            rain_label = f"Light rainfall ({rain_val:.1f} mm) partially meets crop demand"
        elif rain_val > 0.0:
            rain_contrib = 0.12
            rain_dir = "increases_risk"
            rain_label = f"Inadequate rainfall ({rain_val:.1f} mm) indicates emerging cumulative moisture deficit"
        else:
            rain_contrib = 0.28
            rain_dir = "increases_risk"
            rain_label = "Zero precipitation (0.0 mm) recorded; cumulative rainfall deficit accumulating"
    else:
        rain_contrib = 0.05
        rain_dir = "neutral"
        rain_label = "Precipitation observation unavailable; using regional climate normal proxy"

    drivers.append(
        DriverResponse(
            rank=1,
            feature="rainfall_deficit",
            label=rain_label,
            value=rain_val,
            contribution=round(rain_contrib, 3),
            direction=rain_dir,
        )
    )

    # NDVI component
    ndvi_val = ndvi_obs.get("value") if has_ndvi else None
    if has_ndvi and ndvi_val is not None:
        if sat_suspect:
            ndvi_contrib = 0.18
            ndvi_dir = "increases_risk"
            ndvi_label = f"NDVI ({ndvi_val:.2f}) flagged SUSPECT (potential cloud or sensor contamination)"
        elif ndvi_val >= 0.70:
            ndvi_contrib = -0.20
            ndvi_dir = "decreases_risk"
            ndvi_label = f"Dense, vigorous vegetative canopy (NDVI {ndvi_val:.2f}) indicates robust health"
        elif ndvi_val >= 0.55:
            ndvi_contrib = -0.04
            ndvi_dir = "decreases_risk"
            ndvi_label = f"Moderate vegetative vigor (NDVI {ndvi_val:.2f}) consistent with crop growth stage"
        elif ndvi_val >= 0.45:
            ndvi_contrib = 0.12
            ndvi_dir = "increases_risk"
            ndvi_label = f"Declining canopy vigor (NDVI {ndvi_val:.2f}) signals emerging vegetative stress"
        else:
            ndvi_contrib = 0.24
            ndvi_dir = "increases_risk"
            ndvi_label = f"Sparse canopy or low vigor (NDVI {ndvi_val:.2f}) indicates significant stress or late senescence"
    else:
        ndvi_contrib = 0.08 if sat_stale else 0.0
        ndvi_dir = "increases_risk" if sat_stale else "neutral"
        if sat_stale:
            sat_age = sat_fresh.get("age_days", 13)
            ndvi_label = f"Satellite NDVI observation missing/stale ({sat_age} days old); ground verification required"
        else:
            ndvi_label = "Satellite NDVI observation unavailable for this plot"

    drivers.append(
        DriverResponse(
            rank=2,
            feature="vegetation_canopy_ndvi",
            label=ndvi_label,
            value=ndvi_val,
            contribution=round(ndvi_contrib, 3),
            direction=ndvi_dir,
        )
    )

    # Crop stage phenology component
    crop_name = field.get("crop", "Vegetables")
    stage_dir = "increases_risk" if stage_weight > 0 else ("decreases_risk" if stage_weight < 0 else "neutral")
    if stage in ("Flowering", "Fruiting"):
        stage_label = f"{crop_name} in {stage} stage has peak sensitivity to moisture deficit"
    elif stage == "Bulb Development":
        stage_label = f"{crop_name} in {stage} stage requires uninterrupted soil-water tension"
    elif stage == "Head Formation":
        stage_label = f"{crop_name} in {stage} stage requires steady moisture availability"
    elif stage == "Harvesting":
        stage_label = f"{crop_name} in {stage} stage has reduced irrigation demand; excess water discouraged"
    elif stage == "Sowing":
        stage_label = f"{crop_name} in {stage} stage requires surface moisture but low absolute volume"
    else:
        stage_label = f"{crop_name} in {stage} stage has standard vegetative moisture tolerance"

    drivers.append(
        DriverResponse(
            rank=3,
            feature="crop_stage_sensitivity",
            label=stage_label,
            value=None,
            contribution=round(stage_weight, 3),
            direction=stage_dir,
        )
    )

    # Soil / Root-zone component
    soil_val = soil_obs.get("value") if has_soil else None
    if has_soil and soil_val is not None:
        if soil_val >= 25.0:
            soil_contrib = -0.15
            soil_dir = "decreases_risk"
            soil_label = f"Root-zone soil moisture at {soil_val:.1f}% indicates adequate moisture buffering"
        elif soil_val >= 18.0:
            soil_contrib = 0.00
            soil_dir = "neutral"
            soil_label = f"Root-zone soil moisture at {soil_val:.1f}% approaching management allowable depletion"
        else:
            soil_contrib = 0.20
            soil_dir = "increases_risk"
            soil_label = f"Root-zone soil moisture at {soil_val:.1f}% indicates depleted available water capacity"
    else:
        soil_contrib = 0.00
        soil_dir = "neutral"
        soil_label = "Direct root-zone soil telemetry unobserved; relying on climate water-balance proxy"

    drivers.append(
        DriverResponse(
            rank=4,
            feature="soil_water_proxy",
            label=soil_label,
            value=soil_val,
            contribution=round(soil_contrib, 3),
            direction=soil_dir,
        )
    )

    # 5. Calculate composite stress probability
    raw_stress = base_score + rain_contrib + ndvi_contrib + stage_weight + soil_contrib
    stress_probability = max(0.05, min(0.95, round(raw_stress, 2)))

    # Calibrate risk state and status
    if stress_probability >= 0.70:
        risk_state = "HIGH"
        status = "red"
    elif stress_probability >= 0.35:
        risk_state = "MODERATE"
        status = "amber"
    else:
        risk_state = "LOW"
        status = "green"

    # 6. Confidence & Uncertainty estimation
    base_confidence = 0.88
    if not has_rain or rain_stale:
        base_confidence -= 0.15
    if not has_ndvi:
        base_confidence -= 0.15
    elif sat_stale:
        base_confidence -= 0.20
    elif sat_suspect:
        base_confidence -= 0.15
    if not has_soil or soil_stale:
        base_confidence -= 0.08

    confidence = max(0.35, min(0.95, round(base_confidence, 2)))

    # Uncertainty band: wider when confidence is low
    half_width = round((1.0 - confidence) * 0.45, 2)
    p10 = max(0.0, round(stress_probability - half_width, 2))
    p50 = stress_probability
    p90 = min(1.0, round(stress_probability + half_width, 2))
    uncertainty_band = UncertaintyBand(p10=p10, p50=p50, p90=p90)

    # 7. Recommended action
    # Priority action rule: if data is stale or suspect, require field inspection
    is_uncertain = rain_stale or sat_stale or sat_suspect
    if status == "red":
        recommended_action = "inspect" if is_uncertain else "irrigate_now"
    elif status == "amber":
        recommended_action = "inspect" if is_uncertain else "watch"
    else:
        recommended_action = "wait"

    # Freshness metadata parsing
    freshness = {k: FreshnessMeta(**v) for k, v in freshness_raw.items()}

    # As of date from weather or default
    as_of_date = weather_fresh.get("last_updated") or "2026-10-08T00:00:00Z"

    return ForecastResponse(
        field_id=field_id,
        as_of_date=as_of_date,
        horizon_days=DEFAULT_HORIZON_DAYS,
        stress_probability=stress_probability,
        status=status,
        risk_state=risk_state,
        recommended_action=recommended_action,
        confidence=confidence,
        uncertainty_band=uncertainty_band,
        top_drivers=drivers,
        freshness=freshness,
        input_availability=input_availability,
        model_version=MODEL_VERSION,
        model_type=MODEL_TYPE,
        data_type=DATA_TYPE,
    )
