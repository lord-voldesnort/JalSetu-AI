# JalSetu AI — Authoritative API Contract
**Version:** `v0.1-demo` (Frozen Baseline)
**Base URLs:**
- Development Server: `http://localhost:8000` or `http://127.0.0.1:8000`
- Prefixes: All endpoints are accessible both directly at root (`/`) and with the `/api/v1` prefix.

---

## 1. System Health

### `GET /health` (Alias: `GET /api/v1/health`)
Checks backend operational status and database readiness.

- **Response `200 OK`:**
```json
{
  "status": "ok",
  "app": "JalSetu AI",
  "service": "jalsetu-core",
  "environment": "development",
  "version": "0.1.0",
  "database": "connected"
}
```

---

## 2. Field Cadastre & Monitoring

### `GET /fields` (Alias: `GET /api/v1/fields`)
Returns the complete cluster of demonstration fields in GeoJSON `FeatureCollection` format, enriched with live risk and recommended action attributes.

- **Query Parameters:**
  - `scenario_id` (optional, string): Evaluate fields under a specific scenario override (e.g. `rainfall_deficit_heat_01`).
- **Response `200 OK` (`FieldFeatureCollection`):**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "id": "PC-001",
      "properties": {
        "id": "PC-001",
        "name": "Malekar Farm (Block A)",
        "crop": "Tomato",
        "stage": "Flowering",
        "area_acres": 3.5,
        "area_ha": 1.42,
        "stress_status": "red",
        "stress_probability": 0.82,
        "recommended_action": "irrigate_now"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [73.7812, 18.6608],
            [73.7824, 18.6608],
            [73.7824, 18.6616],
            [73.7812, 18.6616],
            [73.7812, 18.6608]
          ]
        ]
      }
    }
  ]
}
```

### `GET /fields/{field_id}` (Alias: `GET /api/v1/fields/{field_id}`)
Returns a single GeoJSON `FieldFeature`. Returns `404 Not Found` if `field_id` is unknown.

### `GET /fields/{field_id}/status` (Alias: `GET /api/v1/fields/{field_id}/status`)
Returns comprehensive diagnostic assessment, contributing drivers, and sensor freshness table.

- **Response `200 OK` (`FieldAssessmentResponse`):**
```json
{
  "field_id": "PC-001",
  "field_name": "Malekar Farm (Block A)",
  "crop": "Tomato",
  "stage": "Flowering",
  "area_acres": 3.5,
  "area_ha": 1.42,
  "as_of_date": "2026-10-08",
  "risk_score": 82.0,
  "stress_index": 0.82,
  "risk_level": "High",
  "stress_status": "red",
  "recommended_action": "irrigate_now",
  "action_window": "Next 24-48 hours",
  "recommended_volume_m3": 18.5,
  "confidence": 0.85,
  "is_simulated": false,
  "active_scenario": "normal_01",
  "drivers": [
    {
      "signal_name": "soil_moisture",
      "observed_value": 24.5,
      "unit": "%",
      "contribution_points": 34.0,
      "direction": "increases_stress",
      "statement": "Low volumetric soil moisture (24.5%) below critical threshold"
    }
  ],
  "freshness_table": [
    {
      "variable": "soil_moisture",
      "source": "FDR Soil Probe",
      "observed_at": "2026-10-08T06:00:00Z",
      "age_days": 0,
      "quality_flag": "good",
      "is_stale": false
    }
  ],
  "warnings": [],
  "policy_disclaimer": "Planning aid only. Recommendations require agronomist verification."
}
```

---

## 3. Stress Forecasting

### `GET /forecast/{field_id}` (Alias: `GET /api/v1/forecast/{field_id}`)
Generates a multi-day projected water stress trajectory with uncertainty intervals (P10–P90).

- **Query Parameters:**
  - `horizon_days` (optional, integer, default: `7`, allowed: `3`, `5`, `7`). Returns `422` if out of bounds.
  - `scenario_id` (optional, string).
- **Response `200 OK` (`FieldForecastResponse`):**
```json
{
  "field_id": "PC-001",
  "field_name": "Malekar Farm (Block A)",
  "horizon_days": 7,
  "as_of_date": "2026-10-08",
  "daily_projections": [
    {
      "day_offset": 1,
      "date": "2026-10-09",
      "projected_risk_score": 82.0,
      "projected_stress_index": 0.82,
      "projected_status": "red",
      "projected_soil_moisture": 23.5,
      "forecast_tmax": 33.5,
      "forecast_rainfall": 0.0,
      "confidence_p10": 74.0,
      "confidence_p90": 89.0
    }
  ],
  "influencing_inputs": ["soil_moisture", "canopy_temp", "et0", "crop_stage"],
  "model_version": "heuristic-baseline-v0.1",
  "data_freshness_warning": null,
  "limitations_disclaimer": "Synthetic heuristic projection."
}
```

---

## 4. Scenario Simulation

### `GET /scenarios` (Alias: `GET /api/v1/scenarios`)
Lists available deterministic climate shock scenarios.

- **Response `200 OK`:**
```json
{
  "count": 3,
  "scenarios": [
    {
      "id": "normal_01",
      "name": "normal_01",
      "title": "Baseline Seasonal Conditions",
      "description": "Standard dry season agricultural weather conditions.",
      "scenario_type": "baseline",
      "affected_field_ids": []
    },
    {
      "id": "rainfall_deficit_heat_01",
      "name": "rainfall_deficit_heat_01",
      "title": "Rainfall Deficit + Heatwave",
      "description": "40% rainfall deficit with +3°C heatwave.",
      "scenario_type": "drought_heat",
      "affected_field_ids": ["PC-001", "PC-004", "PC-007"]
    },
    {
      "id": "heavy_rain_pause_01",
      "name": "heavy_rain_pause_01",
      "title": "Unseasonal Heavy Rain Deluge",
      "description": "65mm cloudburst causing saturation.",
      "scenario_type": "deluge",
      "affected_field_ids": ["PC-001", "PC-002", "PC-003", "PC-005", "PC-006", "PC-008", "PC-010"]
    }
  ]
}
```

### `POST /scenario/replay` (Alias: `POST /api/v1/scenario/replay`)
Replays a climate scenario without mutating underlying baseline observations.

- **Request Body:**
```json
{
  "scenario_id": "rainfall_deficit_heat_01"
}
```
- **Response `200 OK` (`ScenarioReplayResponse`):**
```json
{
  "scenario_id": "rainfall_deficit_heat_01",
  "name": "rainfall_deficit_heat_01",
  "title": "Rainfall Deficit + Heatwave",
  "description": "40% rainfall deficit with +3°C heatwave.",
  "scenario_type": "drought_heat",
  "is_synthetic_replay": true,
  "affected_field_ids": ["PC-001", "PC-004", "PC-007"],
  "signals_changed": [
    {
      "variable": "canopy_temp",
      "unit": "°C",
      "baseline_value": 31.0,
      "simulated_value": 34.0,
      "difference": 3.0,
      "description": "+3°C canopy thermal stress"
    }
  ],
  "fields_affected_count": 3,
  "field_status_diffs": [
    {
      "field_id": "PC-001",
      "field_name": "Malekar Farm (Block A)",
      "baseline_score": 82.0,
      "simulated_score": 94.0,
      "baseline_status": "red",
      "simulated_status": "red",
      "baseline_action": "irrigate_now",
      "simulated_action": "irrigate_now",
      "changed": true
    }
  ],
  "summary_narrative": "Scenario increased water stress across 3 vulnerable fields."
}
```

### `POST /scenario/reset` (Alias: `POST /api/v1/scenario/reset`)
Resets active scenario state back to `normal_01`.

---

## 5. Constrained Water Allocation Planner

### `POST /water-plan` (Alias: `POST /api/v1/water-plan`)
Solves constrained water distribution across the cluster under a bounded budget.

- **Request Body (Dual-Schema Compatible):**
```json
{
  "budget": 100.0,
  "scenario_id": "normal_01",
  "method": "ai",
  "planning_window_days": 7
}
```
*Note: Also accepts `"budget_units": 100` as an alias for `"budget"`.*

- **Response `200 OK` (`WaterPlanResponse`):**
```json
{
  "plan_id": "plan-7f1a8b9c",
  "as_of_date": "2026-10-08",
  "scenario_id": "normal_01",
  "is_simulated": true,
  "requested_budget_m3": 100.0,
  "budget_units": 100.0,
  "total_allocated_m3": 95.8,
  "allocated_units": 95.8,
  "unallocated_remainder_m3": 4.2,
  "budget_utilization_pct": 95.8,
  "constraint_checks": {
    "budget_conserved": true,
    "all_allocations_non_negative": true,
    "capacities_respected": true,
    "paused_fields_zeroed": true
  },
  "allocations": [
    {
      "field_id": "PC-001",
      "field_name": "Malekar Farm (Block A)",
      "priority_rank": 1,
      "priority": 1,
      "risk_score": 82.0,
      "risk_level": "High",
      "stress_status": "red",
      "requested_demand_m3": 21.0,
      "allocated_volume_m3": 21.0,
      "allocated_units": 21.0,
      "capacity_limit_m3": 21.0,
      "allocation_percentage": 100.0,
      "action_recommendation": "irrigate_now",
      "recommended_action": "irrigate_now",
      "reason": "Top priority flowering tomato experiencing critical soil deficit (82.0 risk score).",
      "warnings": []
    }
  ],
  "baseline_comparison": {
    "baseline_method": "fixed_equal",
    "total_budget_m3": 100.0,
    "ai_allocated_total_m3": 95.8,
    "baseline_allocated_total_m3": 100.0,
    "ai_high_risk_allocation_m3": 45.0,
    "baseline_high_risk_allocation_m3": 20.0,
    "ai_high_risk_share_pct": 47.0,
    "baseline_high_risk_share_pct": 20.0,
    "top_stressed_fields_funded_ai": 2,
    "top_stressed_fields_funded_baseline": 1,
    "narrative": "AI water plan directed 47% of scarce water to High-risk fields compared to only 20% in fixed allocation."
  },
  "disclaimer": "Simulated allocation model. Planning tool only."
}
```

---

## 6. Action Events & Governance

### `POST /events` (Alias: `POST /api/v1/events`)
Records an irrigation decision or override to the persistent audit ledger.

- **Request Body (`ActionEventRequest`):**
```json
{
  "field_id": "PC-001",
  "action_taken": "wait",
  "followed_recommendation": false,
  "override_reason": "pump_maintenance",
  "planned_volume_m3": 18.5,
  "actual_volume_m3": 0.0,
  "user_role": "farmer",
  "notes": "Pump mechanical maintenance in progress"
}
```
*Validation Rule: When `followed_recommendation` is `false`, `override_reason` is **mandatory**. Omission returns `HTTP 422 Unprocessable Content`.*

- **Response `201 Created` (`ActionEventResponse`):**
```json
{
  "event_id": "evt-550e8400-e29b-41d4-a716-446655440000",
  "field_id": "PC-001",
  "timestamp": "2026-11-09T09:45:00Z",
  "recommended_action": "irrigate_now",
  "action_taken": "wait",
  "followed_recommendation": false,
  "override_reason": "pump_maintenance",
  "planned_volume_m3": 18.5,
  "actual_volume_m3": 0.0,
  "user_role": "farmer",
  "status": "logged"
}
```

### `GET /events` (Alias: `GET /api/v1/events`)
Retrieves chronological event history. Accepts `?limit=50` (integer).

---

## 7. Metrics & Analytics

### `GET /metrics` (Alias: `GET /api/v1/metrics`)
Returns operational analytics calculated directly from persisted records.

- **Response `200 OK` (`SystemMetricsResponse`):**
```json
{
  "total_fields": 10,
  "total_observations": 170,
  "total_events_logged": 4,
  "overrides_logged": 1,
  "adherence_rate_pct": 75.0,
  "override_reasons_breakdown": {
    "pump_maintenance": 1
  },
  "risk_distribution": {
    "green": 3,
    "amber": 5,
    "red": 2
  },
  "active_scenario": "normal_01",
  "database_type": "sqlite"
}
```

---

## 8. Frozen Contract Guarantee

> [!IMPORTANT]
> **Field identifiers and core schema names are FROZEN at `v0.1-demo`:**
> `PC-001` through `PC-010`.
> Any future modifications must be introduced through explicit versioned routes (`/api/v2`) or additive non-breaking fields.
