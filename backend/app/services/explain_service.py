"""
Explainability Service for JalSetu AI.

Reuses A3 stress forecast and A4 scenario replay to generate explainable Why cards
and feature driver rankings for farmers and water managers.
"""

from typing import Optional
from app.data.fixtures import DEMO_FIELDS_RAW, DEMO_STATUS_RAW
from app.schemas.explain import ExplainResponse
from app.schemas.scenario import ScenarioReplayRequest
from app.services.forecast_service import (
    compute_field_forecast,
    MODEL_VERSION,
    MODEL_TYPE,
    DATA_TYPE,
)
from app.services.scenario_service import compute_scenario_replay
from app.services.optimizer_service import SUPPORTED_SCENARIOS, derive_field_action


def compute_field_explanation(
    field_id: str,
    scenario_id: Optional[str] = None,
    horizon_days: Optional[int] = 7,
) -> Optional[ExplainResponse]:
    """
    Generate explainability response for a specific field under baseline or hypothetical scenario.
    Returns None if field_id or scenario_id is not found.
    """
    field = next((f for f in DEMO_FIELDS_RAW if f["id"] == field_id), None)
    if not field:
        return None

    if scenario_id and scenario_id not in SUPPORTED_SCENARIOS:
        return None

    status_raw = DEMO_STATUS_RAW.get(field_id, {})
    freshness_raw = status_raw.get("freshness", {})
    weather_fresh = freshness_raw.get("weather", {})
    sat_fresh = freshness_raw.get("satellite", {})

    # Evaluate forecast under scenario or baseline
    scenario_params = SUPPORTED_SCENARIOS.get(scenario_id) if scenario_id else None
    if scenario_params and scenario_id not in ("baseline", "normal_01"):
        scen_req = ScenarioReplayRequest(
            field_id=field_id,
            scenario_name=scenario_id,
            rainfall_multiplier=scenario_params.get("rainfall_multiplier"),
            delta_rainfall_mm=scenario_params.get("delta_rainfall_mm"),
            temperature_delta_c=scenario_params.get("temperature_delta_c"),
            heat_wave_intensity=scenario_params.get("heat_wave_intensity"),
            horizon_days=horizon_days or 7,
        )
        scen_resp = compute_scenario_replay(scen_req)
        if not scen_resp:
            return None
        forecast = scen_resp.scenario_forecast
    else:
        forecast = compute_field_forecast(field_id)
        if not forecast:
            return None

    # Check signal freshness & quality
    is_stale = bool(
        weather_fresh.get("stale", False)
        or sat_fresh.get("stale", False)
        or sat_fresh.get("quality_flag") in ("STALE", "MISSING")
        or weather_fresh.get("quality_flag") == "STALE"
        or forecast.confidence < 0.60
    )

    # Check pause condition
    rain_obs = next((o for o in status_raw.get("observations", []) if o.get("variable") == "rainfall_mm"), None)
    rain_val = float(rain_obs.get("value", 0.0)) if (rain_obs and rain_obs.get("value") is not None) else 0.0
    if scenario_params and scenario_params.get("delta_rainfall_mm"):
        rain_val += float(scenario_params["delta_rainfall_mm"])
    is_paused = rain_val >= 35.0

    # Derive canonical action
    action, action_reason = derive_field_action(
        risk_state=forecast.risk_state,
        stress_probability=forecast.stress_probability,
        is_paused=is_paused,
        is_stale=is_stale,
        is_excluded=False,
        has_override_allocation=False,
    )

    # Compose why_card string
    crop = field.get("crop", "Vegetables")
    stage = field.get("stage", "Vegetative")

    card_parts = []
    if action == "pause":
        card_parts.append(f"PAUSE IRRIGATION: Heavy precipitation detected ({rain_val:.1f} mm). Saturated soil conditions elevate risk of waterlogging.")
    elif action == "inspect":
        stale_reasons = []
        if sat_fresh.get("stale") or sat_fresh.get("quality_flag") in ("STALE", "MISSING"):
            stale_reasons.append(f"satellite NDVI observation is {sat_fresh.get('age_days', 10)} days old / missing")
        if weather_fresh.get("stale"):
            stale_reasons.append(f"weather observation is {weather_fresh.get('age_days', 4)} days old")
        stale_desc = ", and ".join(stale_reasons) if stale_reasons else "telemetry confidence is reduced"
        card_parts.append(f"INSPECT BEFORE IRRIGATING: Telemetry is uncertain because {stale_desc}. Confidence is {forecast.confidence*100:.0f}%. Verify root-zone soil moisture manually before running pumps.")
    elif action == "irrigate":
        primary_driver = forecast.top_drivers[0] if forecast.top_drivers else None
        driver_text = f" Driven primarily by: {primary_driver.label}." if primary_driver else ""
        card_parts.append(f"IRRIGATION RECOMMENDED: Stress probability is {forecast.stress_probability*100:.0f}% ({forecast.risk_state} risk) for {crop} in {stage} stage.{driver_text}")
    else:
        card_parts.append(f"WAIT / MONITOR: Stress probability is low ({forecast.stress_probability*100:.0f}%) for {crop}. Root-zone soil moisture reserves adequately support crop demand over the 7-day horizon.")

    # Driver highlights
    driver_bullets = []
    for d in forecast.top_drivers[:3]:
        impact = "increases stress" if d.direction == "increases_risk" else ("lowers stress" if d.direction == "decreases_risk" else "neutral")
        driver_bullets.append(f"• {d.label} ({impact})")
    
    if driver_bullets:
        card_parts.append("Key Drivers:\n" + "\n".join(driver_bullets))

    why_card_text = "\n\n".join(card_parts)

    return ExplainResponse(
        field_id=field_id,
        field_name=field.get("name", f"Field {field_id}"),
        crop=crop,
        stage=stage,
        area_acres=float(field.get("area_acres", 1.0)),
        as_of_date=forecast.as_of_date,
        horizon_days=horizon_days or 7,
        stress_probability=forecast.stress_probability,
        risk_state=forecast.risk_state,
        confidence=forecast.confidence,
        uncertainty_band=forecast.uncertainty_band,
        top_drivers=forecast.top_drivers,
        freshness=forecast.freshness,
        recommended_action=action,
        action_reason=action_reason,
        why_card=why_card_text,
        insufficient_data=is_stale,
        scenario_id=scenario_id,
        model_version=MODEL_VERSION,
        model_type=MODEL_TYPE,
        data_type=DATA_TYPE,
    )

