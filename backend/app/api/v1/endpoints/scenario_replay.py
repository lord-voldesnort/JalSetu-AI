from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.services.data_loader import data_loader
from app.services.scenario_mgr import scenario_manager
from app.services.stress_engine import stress_engine
from app.schemas.scenario import ScenarioDefinition, ScenarioListResponse
from app.schemas.scenario_replay import (
    ScenarioReplayRequest,
    ScenarioReplayResponse,
    ScenarioSignalDiff,
    FieldStatusDiff
)

router = APIRouter()


@router.get("", response_model=ScenarioListResponse, tags=["Scenarios"])
def list_scenarios():
    """List all available deterministic climate scenario fixtures."""
    scenarios = data_loader.load_scenarios()
    return ScenarioListResponse(
        count=len(scenarios),
        scenarios=scenarios
    )


@router.get("/{scenario_id}", response_model=ScenarioDefinition, tags=["Scenarios"])
def get_scenario(scenario_id: str):
    """Retrieve detailed scenario definition and signal perturbation rules."""
    try:
        return scenario_manager.get_scenario(scenario_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.post("/replay", response_model=ScenarioReplayResponse, tags=["Scenarios"])
def replay_scenario(payload: ScenarioReplayRequest):
    """
    Replay a deterministic climate scenario without modifying underlying fixtures.
    Recalculates risk assessments, flags simulated signals, and produces before-and-after diffs.
    """
    try:
        scenario = scenario_manager.set_active_scenario(payload.scenario_id)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

    # 1. Baseline assessment
    baseline_summary = stress_engine.assess_cluster(scenario_id_override="normal_01")
    baseline_map = {f.field_id: f for f in baseline_summary.fields}

    # 2. Simulated assessment
    simulated_summary = stress_engine.assess_cluster(scenario_id_override=payload.scenario_id)
    simulated_map = {f.field_id: f for f in simulated_summary.fields}

    # 3. Compute signal diffs
    signal_diffs = []
    for sig in scenario.changed_input_signals:
        signal_diffs.append(
            ScenarioSignalDiff(
                variable=sig.variable,
                unit=sig.unit,
                baseline_value=sig.baseline_reference_value if sig.baseline_reference_value is not None else 0.0,
                simulated_value=sig.replayed_value if sig.replayed_value is not None else sig.value,
                difference=round(
                    (sig.replayed_value if sig.replayed_value is not None else sig.value) -
                    (sig.baseline_reference_value if sig.baseline_reference_value is not None else 0.0),
                    2
                ),
                description=sig.description or f"Modified {sig.variable}"
            )
        )

    # 4. Compute field status diffs
    field_diffs = []
    affected_count = 0
    for fid, b_ass in baseline_map.items():
        s_ass = simulated_map[fid]
        changed = (b_ass.risk_score != s_ass.risk_score or b_ass.stress_status != s_ass.stress_status)
        if changed:
            affected_count += 1

        field_diffs.append(
            FieldStatusDiff(
                field_id=fid,
                field_name=b_ass.field_name,
                baseline_score=b_ass.risk_score,
                simulated_score=s_ass.risk_score,
                baseline_status=b_ass.stress_status,
                simulated_status=s_ass.stress_status,
                baseline_action=b_ass.recommended_action,
                simulated_action=s_ass.recommended_action,
                changed=changed
            )
        )

    # Narrative
    if payload.scenario_id == "normal_01":
        narrative = "Reset to nominal baseline state. All signals restored to unperturbed observation fixtures."
    elif payload.scenario_id == "rainfall_deficit_heat_01":
        narrative = (
            f"Applied compound shock: heat wave (+4°C) and zero rainfall. "
            f"Escalated stress on {affected_count} fields ({', '.join(scenario.affected_field_ids)}) into Amber/Red risk."
        )
    elif payload.scenario_id == "heavy_rain_pause_01":
        narrative = (
            f"Applied cloudburst (65 mm) & forecast rain (42 mm). Saturated soil moisture on fields "
            f"({', '.join(scenario.affected_field_ids)}). Activated 'protect_pause' safety rule."
        )
    else:
        narrative = f"Applied scenario {scenario.name}."

    return ScenarioReplayResponse(
        scenario_id=scenario.id,
        name=scenario.name,
        title=scenario.title,
        description=scenario.description,
        scenario_type=scenario.scenario_type,
        is_synthetic_replay=True,
        affected_field_ids=scenario.affected_field_ids,
        signals_changed=signal_diffs,
        fields_affected_count=affected_count,
        field_status_diffs=field_diffs,
        summary_narrative=narrative
    )


@router.post("/reset", response_model=ScenarioReplayResponse, tags=["Scenarios"])
def reset_scenario():
    """Reset the cluster replay state back to nominal baseline (normal_01)."""
    return replay_scenario(ScenarioReplayRequest(scenario_id="normal_01"))

