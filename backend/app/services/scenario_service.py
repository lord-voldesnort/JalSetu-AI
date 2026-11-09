"""
Scenario Replay Service for JalSetu AI.

Evaluates hypothetical climate and management shock scenarios against
deterministic baseline field observations without mutating underlying fixtures.
"""

from typing import Any, Dict, List, Optional
from app.data.fixtures import DEMO_FIELDS_RAW, DEMO_STATUS_RAW
from app.schemas.field import FreshnessMeta
from app.schemas.forecast import DriverResponse, ForecastResponse, UncertaintyBand
from app.schemas.scenario import (
    ChangedDriver,
    RiskProbabilityChange,
    ScenarioReplayRequest,
    ScenarioReplayResponse,
)
from app.services.forecast_service import (
    STAGE_SENSITIVITY_WEIGHTS,
    MODEL_VERSION,
    MODEL_TYPE,
    DATA_TYPE,
    compute_field_forecast,
)


def compute_scenario_replay(request: ScenarioReplayRequest) -> Optional[ScenarioReplayResponse]:
    """
    Evaluate deterministic baseline versus hypothetical scenario shock.
    Returns None if field_id is unknown.
    """
    field_id = request.field_id
    field = next((f for f in DEMO_FIELDS_RAW if f["id"] == field_id), None)
    if not field:
        return None

    status_raw = DEMO_STATUS_RAW.get(field_id)
    if not status_raw:
        return None

    # 1. Compute unmodified baseline forecast
    baseline_forecast = compute_field_forecast(field_id)
    if not baseline_forecast:
        return None

    observations = status_raw.get("observations", [])
    freshness_raw = status_raw.get("freshness", {})

    rain_obs = next((o for o in observations if o.get("variable") == "rainfall_mm"), None)
    ndvi_obs = next((o for o in observations if o.get("variable") == "ndvi"), None)
    soil_obs = next((o for o in observations if o.get("variable") == "soil_moisture_pct"), None)

    weather_fresh = freshness_raw.get("weather", {})
    sat_fresh = freshness_raw.get("satellite", {})
    soil_fresh = freshness_raw.get("soil", {})

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

    is_uncertain = rain_stale or sat_stale or sat_suspect

    # 2. Derive hypothetical scenario moisture and heat parameters
    base_rain_val = float(rain_obs.get("value", 0.0)) if (has_rain and rain_obs.get("value") is not None) else 0.0
    scen_rain_val = base_rain_val

    if request.rainfall_multiplier is not None:
        scen_rain_val = scen_rain_val * request.rainfall_multiplier
    if request.delta_rainfall_mm is not None:
        scen_rain_val = max(0.0, scen_rain_val + request.delta_rainfall_mm)
    if request.simulated_irrigation_mm is not None:
        scen_rain_val = scen_rain_val + request.simulated_irrigation_mm
    scen_rain_val = round(scen_rain_val, 2)

    temp_delta = float(request.temperature_delta_c) if request.temperature_delta_c is not None else 0.0

    # 3. Compute scenario heuristic components
    stage = field.get("stage", "Vegetative")
    stage_weight = STAGE_SENSITIVITY_WEIGHTS.get(stage, 0.0)
    crop_name = field.get("crop", "Vegetables")
    base_score = 0.38

    # Rain / moisture component in scenario
    if scen_rain_val >= 35.0:
        scen_rain_contrib = -0.32
        scen_rain_dir = "decreases_risk"
        scen_rain_label = f"Intense precipitation simulated ({scen_rain_val:.1f} mm); high moisture surplus, waterlogging watch"
    elif scen_rain_val >= 20.0:
        scen_rain_contrib = -0.28
        scen_rain_dir = "decreases_risk"
        scen_rain_label = f"Hypothetical moisture ({scen_rain_val:.1f} mm) replenishes root zone reserves"
    elif scen_rain_val >= 10.0:
        scen_rain_contrib = -0.18
        scen_rain_dir = "decreases_risk"
        scen_rain_label = f"Hypothetical moisture ({scen_rain_val:.1f} mm) offsets near-term evaporative demand"
    elif scen_rain_val >= 5.0:
        scen_rain_contrib = -0.08
        scen_rain_dir = "decreases_risk"
        scen_rain_label = f"Hypothetical moisture ({scen_rain_val:.1f} mm) partially meets crop demand"
    elif scen_rain_val > 0.0:
        scen_rain_contrib = 0.12
        scen_rain_dir = "increases_risk"
        scen_rain_label = f"Hypothetical low moisture ({scen_rain_val:.1f} mm) indicates continuing moisture deficit"
    else:
        scen_rain_contrib = 0.28
        scen_rain_dir = "increases_risk"
        scen_rain_label = "Complete precipitation deficit simulated (0.0 mm); severe drought stress"

    has_simulated_rain = (
        request.delta_rainfall_mm is not None or request.simulated_irrigation_mm is not None
    )
    if not has_rain and not has_simulated_rain:
        scen_rain_contrib = 0.05
        scen_rain_dir = "neutral"
        scen_rain_label = "Precipitation observation unavailable; using regional climate normal proxy"

    # Heat wave / temperature shock component
    if temp_delta > 0.0:
        scen_heat_contrib = round(min(0.25, (temp_delta / 4.0) * 0.08), 3)
        if stage in ("Flowering", "Fruiting"):
            scen_heat_contrib += 0.04
        scen_heat_dir = "increases_risk"
        scen_heat_label = f"Simulated heat wave (+{temp_delta:.1f}°C) elevates crop evapotranspiration & thermal stress"
    elif temp_delta < 0.0:
        scen_heat_contrib = round(max(-0.12, (temp_delta / 4.0) * 0.06), 3)
        scen_heat_dir = "decreases_risk"
        scen_heat_label = f"Cooling temperature anomaly ({temp_delta:.1f}°C) lowers atmospheric evaporative demand"
    else:
        scen_heat_contrib = 0.0
        scen_heat_dir = "neutral"
        scen_heat_label = "Atmospheric temperature aligned with baseline seasonal climatology"

    # NDVI component (reused from baseline)
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

    # Soil component
    soil_val = soil_obs.get("value") if has_soil else None
    irrigation_buffering = -0.08 if (request.simulated_irrigation_mm and request.simulated_irrigation_mm > 0.0) else 0.0
    if has_soil and soil_val is not None:
        if soil_val >= 25.0:
            soil_contrib = -0.15 + irrigation_buffering
            soil_dir = "decreases_risk"
            soil_label = f"Root-zone soil moisture at {soil_val:.1f}% indicates adequate moisture buffering"
        elif soil_val >= 18.0:
            soil_contrib = 0.00 + irrigation_buffering
            soil_dir = "decreases_risk" if irrigation_buffering < 0 else "neutral"
            soil_label = f"Root-zone soil moisture at {soil_val:.1f}% approaching management allowable depletion"
        else:
            soil_contrib = 0.20 + irrigation_buffering
            soil_dir = "increases_risk" if soil_contrib > 0 else "decreases_risk"
            soil_label = f"Root-zone soil moisture at {soil_val:.1f}% indicates depleted available water capacity"
    else:
        soil_contrib = 0.00 + irrigation_buffering
        soil_dir = "decreases_risk" if irrigation_buffering < 0 else "neutral"
        soil_label = "Direct root-zone soil telemetry unobserved; relying on climate water-balance proxy"

    # Stage phenology driver label
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

    # 4. Composite scenario stress probability
    raw_scenario_stress = base_score + scen_rain_contrib + ndvi_contrib + stage_weight + soil_contrib + scen_heat_contrib
    scenario_probability = max(0.05, min(0.95, round(raw_scenario_stress, 2)))

    # Scenario status and risk state
    if scenario_probability >= 0.70:
        scen_status = "red"
        scen_risk = "HIGH"
    elif scenario_probability >= 0.35:
        scen_status = "amber"
        scen_risk = "MODERATE"
    else:
        scen_status = "green"
        scen_risk = "LOW"

    # Scenario recommended action
    if scen_rain_val >= 35.0:
        scen_action = "protect_pause"
    elif scen_status == "red":
        scen_action = "inspect" if is_uncertain else "irrigate_now"
    elif scen_status == "amber":
        scen_action = "inspect" if is_uncertain else "watch"
    else:
        scen_action = "wait"

    # Scenario drivers
    scenario_drivers: List[DriverResponse] = [
        DriverResponse(
            rank=1,
            feature="rainfall_deficit",
            label=scen_rain_label,
            value=scen_rain_val,
            contribution=round(scen_rain_contrib, 3),
            direction=scen_rain_dir,
        )
    ]
    rank_idx = 2
    if temp_delta != 0.0:
        scenario_drivers.append(
            DriverResponse(
                rank=rank_idx,
                feature="heat_load_forecast",
                label=scen_heat_label,
                value=temp_delta,
                contribution=round(scen_heat_contrib, 3),
                direction=scen_heat_dir,
            )
        )
        rank_idx += 1

    scenario_drivers.append(
        DriverResponse(
            rank=rank_idx,
            feature="vegetation_canopy_ndvi",
            label=ndvi_label,
            value=ndvi_val,
            contribution=round(ndvi_contrib, 3),
            direction=ndvi_dir,
        )
    )
    rank_idx += 1

    scenario_drivers.append(
        DriverResponse(
            rank=rank_idx,
            feature="crop_stage_sensitivity",
            label=stage_label,
            value=None,
            contribution=round(stage_weight, 3),
            direction=stage_dir,
        )
    )
    rank_idx += 1

    scenario_drivers.append(
        DriverResponse(
            rank=rank_idx,
            feature="soil_water_proxy",
            label=soil_label,
            value=soil_val,
            contribution=round(soil_contrib, 3),
            direction=soil_dir,
        )
    )

    # Confidence and uncertainty for scenario
    confidence = baseline_forecast.confidence
    half_width = round((1.0 - confidence) * 0.45, 2)
    p10 = max(0.0, round(scenario_probability - half_width, 2))
    p50 = scenario_probability
    p90 = min(1.0, round(scenario_probability + half_width, 2))
    scen_uncertainty_band = UncertaintyBand(p10=p10, p50=p50, p90=p90)

    # Input availability
    input_availability = dict(baseline_forecast.input_availability)
    if request.simulated_irrigation_mm and request.simulated_irrigation_mm > 0.0:
        input_availability["days_since_irrigation"] = True

    scenario_forecast = ForecastResponse(
        field_id=field_id,
        as_of_date=baseline_forecast.as_of_date,
        horizon_days=request.horizon_days or 7,
        stress_probability=scenario_probability,
        status=scen_status,
        risk_state=scen_risk,
        recommended_action=scen_action,
        confidence=confidence,
        uncertainty_band=scen_uncertainty_band,
        top_drivers=scenario_drivers,
        freshness=baseline_forecast.freshness,
        input_availability=input_availability,
        model_version=MODEL_VERSION,
        model_type=MODEL_TYPE,
        data_type=DATA_TYPE,
        disclaimer=baseline_forecast.disclaimer,
    )

    # 5. Build change summary
    prob_delta = round(scenario_probability - baseline_forecast.stress_probability, 2)
    if baseline_forecast.status != scen_status:
        transition = f"{baseline_forecast.status} -> {scen_status}"
    else:
        transition = "unchanged"

    change_summary = RiskProbabilityChange(
        baseline_probability=baseline_forecast.stress_probability,
        scenario_probability=scenario_probability,
        probability_delta=prob_delta,
        baseline_status=baseline_forecast.status,
        scenario_status=scen_status,
        baseline_risk_state=baseline_forecast.risk_state,
        scenario_risk_state=scen_risk,
        status_transition=transition,
        risk_level_changed=(baseline_forecast.status != scen_status),
    )

    # 6. Extract changed drivers
    changed_drivers: List[ChangedDriver] = []

    # Rain driver change
    base_rain_driver = next((d for d in baseline_forecast.top_drivers if d.feature == "rainfall_deficit"), None)
    scen_rain_driver = next((d for d in scenario_drivers if d.feature == "rainfall_deficit"), None)
    if base_rain_driver and scen_rain_driver:
        rain_contrib_delta = round(scen_rain_driver.contribution - base_rain_driver.contribution, 3)
        if rain_contrib_delta != 0.0 or scen_rain_val != base_rain_val:
            rain_impact = "increased_risk" if rain_contrib_delta > 0 else ("reduced_risk" if rain_contrib_delta < 0 else "neutral")
            changed_drivers.append(
                ChangedDriver(
                    feature="rainfall_deficit",
                    baseline_contribution=base_rain_driver.contribution,
                    scenario_contribution=scen_rain_driver.contribution,
                    contribution_delta=rain_contrib_delta,
                    baseline_label=base_rain_driver.label,
                    scenario_label=scen_rain_driver.label,
                    impact=rain_impact,
                )
            )

    # Heat driver change
    if temp_delta != 0.0:
        heat_impact = "increased_risk" if scen_heat_contrib > 0 else "reduced_risk"
        changed_drivers.append(
            ChangedDriver(
                feature="heat_load_forecast",
                baseline_contribution=0.0,
                scenario_contribution=scen_heat_contrib,
                contribution_delta=scen_heat_contrib,
                baseline_label="Baseline temperature aligned with seasonal normals",
                scenario_label=scen_heat_label,
                impact=heat_impact,
            )
        )

    # Soil driver change (if irrigation applied)
    if irrigation_buffering != 0.0:
        base_soil_driver = next((d for d in baseline_forecast.top_drivers if d.feature == "soil_water_proxy"), None)
        scen_soil_driver = next((d for d in scenario_drivers if d.feature == "soil_water_proxy"), None)
        if base_soil_driver and scen_soil_driver:
            soil_contrib_delta = round(scen_soil_driver.contribution - base_soil_driver.contribution, 3)
            changed_drivers.append(
                ChangedDriver(
                    feature="soil_water_proxy",
                    baseline_contribution=base_soil_driver.contribution,
                    scenario_contribution=scen_soil_driver.contribution,
                    contribution_delta=soil_contrib_delta,
                    baseline_label=base_soil_driver.label,
                    scenario_label=scen_soil_driver.label + f" (boosted by {request.simulated_irrigation_mm:.1f} mm irrigation)",
                    impact="reduced_risk" if soil_contrib_delta < 0 else "increased_risk",
                )
            )

    # Scenario inputs echo dict
    scenario_inputs_dict = {
        k: v for k, v in request.model_dump().items() if v is not None
    }

    return ScenarioReplayResponse(
        field_id=field_id,
        scenario_inputs=scenario_inputs_dict,
        baseline_forecast=baseline_forecast,
        scenario_forecast=scenario_forecast,
        change_summary=change_summary,
        changed_drivers=changed_drivers,
        input_availability=input_availability,
        freshness=baseline_forecast.freshness,
        uncertainty=scen_uncertainty_band,
        model_version=MODEL_VERSION,
        model_type=MODEL_TYPE,
        data_type=DATA_TYPE,
    )
