import {
  HealthResponse,
  FieldFeatureCollection,
  ScenarioListResponse,
  FieldAssessmentResponse,
  FieldForecastResponse,
  WaterPlanResponse,
  ActionEventResponse,
  SystemMetricsResponse
} from '../types/api';

export const mockHealth: HealthResponse = {
  status: 'ok',
  app: 'JalSetu AI (Mock Mode)',
  service: 'jalsetu-core-mock',
  environment: 'mock-offline-demo',
  version: '0.1.0-mock',
  database: 'static-fixtures-loaded'
};

export const mockFields: FieldFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 'PC-001',
      properties: {
        id: 'PC-001',
        name: 'Field 01 (Malekar Farm)',
        crop: 'tomato',
        stage: 'flowering',
        area_acres: 1.5,
        area_ha: 0.607,
        stress_status: 'amber',
        stress_probability: 0.56,
        recommended_action: 'wait'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7802, 18.6601], [73.7811, 18.66], [73.7812, 18.6609], [73.7801, 18.6608], [73.7802, 18.6601]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-002',
      properties: {
        id: 'PC-002',
        name: 'Field 02 (Kute Plots)',
        crop: 'tomato',
        stage: 'flowering',
        area_acres: 1.2,
        area_ha: 0.486,
        stress_status: 'red',
        stress_probability: 0.82,
        recommended_action: 'irrigate_now'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7813, 18.66], [73.7821, 18.6601], [73.782, 18.6609], [73.7813, 18.6609], [73.7813, 18.66]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-003',
      properties: {
        id: 'PC-003',
        name: 'Field 03 (Thorat Agro)',
        crop: 'cabbage',
        stage: 'head_formation',
        area_acres: 1.8,
        area_ha: 0.728,
        stress_status: 'amber',
        stress_probability: 0.61,
        recommended_action: 'wait'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7822, 18.6601], [73.7831, 18.6601], [73.7831, 18.6609], [73.7821, 18.661], [73.7822, 18.6601]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-004',
      properties: {
        id: 'PC-004',
        name: 'Field 04 (Thorat North)',
        crop: 'cabbage',
        stage: 'vegetative',
        area_acres: 1.0,
        area_ha: 0.405,
        stress_status: 'amber',
        stress_probability: 0.52,
        recommended_action: 'inspect'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7832, 18.6601], [73.784, 18.6601], [73.784, 18.6608], [73.7831, 18.6608], [73.7832, 18.6601]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-005',
      properties: {
        id: 'PC-005',
        name: 'Field 05 (Pawale Krishi)',
        crop: 'cauliflower',
        stage: 'curd_formation',
        area_acres: 1.4,
        area_ha: 0.567,
        stress_status: 'amber',
        stress_probability: 0.58,
        recommended_action: 'wait'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7801, 18.661], [73.7811, 18.661], [73.7812, 18.6618], [73.7802, 18.6618], [73.7801, 18.661]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-006',
      properties: {
        id: 'PC-006',
        name: 'Field 06 (Jadhav Bagayat)',
        crop: 'tomato',
        stage: 'fruiting',
        area_acres: 2.0,
        area_ha: 0.809,
        stress_status: 'red',
        stress_probability: 0.78,
        recommended_action: 'irrigate_now'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7813, 18.661], [73.7822, 18.661], [73.7821, 18.6619], [73.7812, 18.6619], [73.7813, 18.661]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-007',
      properties: {
        id: 'PC-007',
        name: 'Field 07 (Shinde Vasti)',
        crop: 'okra',
        stage: 'flowering',
        area_acres: 1.1,
        area_ha: 0.445,
        stress_status: 'amber',
        stress_probability: 0.49,
        recommended_action: 'wait'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7823, 18.6611], [73.7831, 18.661], [73.7832, 18.6619], [73.7822, 18.662], [73.7823, 18.6611]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-008',
      properties: {
        id: 'PC-008',
        name: 'Field 08 (Landge Canal)',
        crop: 'tomato',
        stage: 'flowering',
        area_acres: 0.9,
        area_ha: 0.364,
        stress_status: 'amber',
        stress_probability: 0.54,
        recommended_action: 'inspect'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7833, 18.661], [73.7841, 18.661], [73.7842, 18.6618], [73.7832, 18.6618], [73.7833, 18.661]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-009',
      properties: {
        id: 'PC-009',
        name: 'Field 09 (Gawade Patil)',
        crop: 'chili',
        stage: 'fruit_development',
        area_acres: 1.6,
        area_ha: 0.648,
        stress_status: 'green',
        stress_probability: 0.32,
        recommended_action: 'wait'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7802, 18.662], [73.7812, 18.6619], [73.7813, 18.6627], [73.7803, 18.6627], [73.7802, 18.662]]]
      }
    },
    {
      type: 'Feature',
      id: 'PC-010',
      properties: {
        id: 'PC-010',
        name: 'Field 10 (Chinchwad Co-op)',
        crop: 'tomato',
        stage: 'seedling',
        area_acres: 1.3,
        area_ha: 0.526,
        stress_status: 'green',
        stress_probability: 0.28,
        recommended_action: 'wait'
      },
      geometry: {
        type: 'Polygon',
        coordinates: [[[73.7814, 18.662], [73.7824, 18.662], [73.7825, 18.6628], [73.7814, 18.6628], [73.7814, 18.662]]]
      }
    }
  ]
};

export const mockScenarios: ScenarioListResponse = {
  count: 3,
  scenarios: [
    {
      id: 'normal_01',
      name: 'normal_01',
      title: 'Baseline Seasonal Weather',
      description: 'Standard historical dry season climate conditions without acute shocks.',
      scenario_type: 'baseline',
      affected_field_ids: []
    },
    {
      id: 'rainfall_deficit_heat_01',
      name: 'rainfall_deficit_heat_01',
      title: 'Rainfall Deficit + Heatwave (+4°C)',
      description: 'Zero precipitation combined with +4°C heatwave accelerating canopy transpiration.',
      scenario_type: 'drought_heat',
      affected_field_ids: ['PC-001', 'PC-003', 'PC-009']
    },
    {
      id: 'heavy_rain_pause_01',
      name: 'heavy_rain_pause_01',
      title: 'Unseasonal Heavy Deluge (65 mm)',
      description: 'Cloudburst precipitation saturating soils and mandating an irrigation pause.',
      scenario_type: 'deluge',
      affected_field_ids: ['PC-001', 'PC-002', 'PC-003', 'PC-005', 'PC-006', 'PC-008', 'PC-010']
    }
  ]
};

export function getMockAssessment(fieldId: string, scenarioId: string = 'normal_01'): FieldAssessmentResponse {
  const isStale = (fieldId === 'PC-008' || fieldId === 'PC-004');
  const isHigh = (fieldId === 'PC-002' || fieldId === 'PC-006' || (scenarioId === 'rainfall_deficit_heat_01' && fieldId === 'PC-001'));
  const isPaused = (scenarioId === 'heavy_rain_pause_01' && ['PC-001', 'PC-002', 'PC-003', 'PC-005'].includes(fieldId));

  const riskScore = isPaused ? 15.0 : isHigh ? 82.0 : isStale ? 54.0 : 45.0;
  const status = isPaused ? 'blue' : isHigh ? 'red' : isStale ? 'amber' : 'green';
  const action = isPaused ? 'protect_pause' : isStale ? 'inspect' : isHigh ? 'irrigate_now' : 'wait';

  return {
    field_id: fieldId,
    field_name: `Field ${fieldId.replace('PC-', '')}`,
    crop: 'tomato',
    stage: 'flowering',
    area_acres: 1.5,
    area_ha: 0.607,
    as_of_date: '2026-10-08',
    risk_score: riskScore,
    stress_index: riskScore / 100.0,
    risk_level: isHigh ? 'High' : 'Moderate',
    stress_status: status,
    recommended_action: action,
    action_window: isHigh ? 'next 24-48h' : 'monitor',
    recommended_volume_m3: isHigh ? 22.0 : isStale ? 12.0 : 0.0,
    confidence: isStale ? 0.60 : 0.88,
    is_simulated: scenarioId !== 'normal_01',
    active_scenario: scenarioId,
    drivers: [
      {
        signal_name: 'Soil Moisture',
        observed_value: isHigh ? 22.0 : 34.0,
        unit: '%',
        contribution_points: isHigh ? 42.0 : 20.0,
        direction: 'increases_stress',
        statement: 'Root zone volumetric water content near stress threshold'
      },
      {
        signal_name: 'Canopy Temperature Differential',
        observed_value: 32.5,
        unit: '°C',
        contribution_points: 25.0,
        direction: 'increases_stress',
        statement: 'Thermal transpiration stress differential'
      },
      {
        signal_name: 'Satellite NDVI Trend',
        observed_value: isStale ? 0.45 : 0.62,
        unit: 'delta',
        contribution_points: 15.0,
        direction: isStale ? 'increases_stress' : 'neutral',
        statement: isStale ? 'Stale observation >12 days old' : 'Canopy vigor normal'
      },
      {
        signal_name: 'Upcoming Rainfall',
        observed_value: isPaused ? 65.0 : 0.0,
        unit: 'mm',
        contribution_points: isPaused ? -40.0 : 10.0,
        direction: isPaused ? 'decreases_stress' : 'increases_stress',
        statement: isPaused ? 'Heavy cloudburst rainfall detected' : 'Zero precipitation in 7-day forecast'
      }
    ],
    freshness_table: [
      { variable: 'soil_moisture', source: 'FDR Soil Probe', observed_at: '2026-10-08T06:00:00Z', age_days: 0, quality_flag: 'good', is_stale: false },
      { variable: 'weather', source: 'Weather Station', observed_at: '2026-10-08T06:00:00Z', age_days: isStale ? 4 : 0, quality_flag: isStale ? 'stale' : 'good', is_stale: isStale },
      { variable: 'satellite_ndvi', source: 'Sentinel-2 MSI', observed_at: '2026-09-25T10:00:00Z', age_days: isStale ? 13 : 2, quality_flag: isStale ? 'stale' : 'good', is_stale: isStale }
    ],
    warnings: isStale ? ['Satellite or sensor observation is stale (>4-12 days old) or missing. Low confidence — inspect field before irrigating.'] : [],
    policy_disclaimer: 'Planning aid only. Synthetic prototype demonstration fixtures.'
  };
}

export function getMockForecast(fieldId: string, horizonDays: number = 7): FieldForecastResponse {
  const points = [];
  for (let d = 1; d <= horizonDays; d++) {
    const risk = Math.min(100.0, 50.0 + d * 5.0);
    points.push({
      day_offset: d,
      date: `2026-10-0${8 + d}`,
      projected_risk_score: risk,
      projected_stress_index: risk / 100.0,
      projected_status: risk > 70 ? 'red' : 'amber',
      projected_soil_moisture: Math.max(0.15, 0.35 - d * 0.02),
      forecast_tmax: 32.0 + (d % 3),
      forecast_rainfall: 0.0,
      confidence_p10: risk - 7.0,
      confidence_p90: risk + 7.0
    });
  }
  return {
    field_id: fieldId,
    field_name: `Field ${fieldId.replace('PC-', '')}`,
    horizon_days: horizonDays,
    as_of_date: '2026-10-08',
    daily_projections: points,
    influencing_inputs: ['soil_moisture', 'canopy_temp', 'et0'],
    model_version: 'deterministic-heuristic-v1',
    limitations_disclaimer: 'Mock demonstration projection trajectory.'
  };
}

export function getMockWaterPlan(budget: number, scenarioId: string = 'normal_01'): WaterPlanResponse {
  const allocs = mockFields.features.map((feat, idx) => {
    const fid = feat.properties.id;
    const isPaused = (scenarioId === 'heavy_rain_pause_01' && idx < 4);
    const allocated = isPaused ? 0.0 : idx < 3 ? Math.min(22.0, budget / 3) : 0.0;
    return {
      field_id: fid,
      field_name: feat.properties.name,
      priority_rank: idx + 1,
      risk_score: isPaused ? 10.0 : 80.0 - idx * 5.0,
      risk_level: idx < 2 ? 'High' : 'Moderate',
      stress_status: isPaused ? 'blue' : idx < 2 ? 'red' : 'amber',
      requested_demand_m3: isPaused ? 0.0 : 22.0,
      allocated_volume_m3: allocated,
      capacity_limit_m3: 25.0,
      allocation_percentage: isPaused ? 0.0 : 88.0,
      action_recommendation: isPaused ? 'protect_pause' : idx < 2 ? 'irrigate_now' : 'wait',
      reason: isPaused ? 'Irrigation paused: heavy precipitation protection rule.' : idx < 3 ? 'Prioritized flowering tomato experiencing critical soil deficit.' : 'Unfunded: budget exhausted.',
      warnings: []
    };
  });

  const totalAlloc = allocs.reduce((sum, a) => sum + a.allocated_volume_m3, 0);

  return {
    plan_id: 'mock-plan-001',
    as_of_date: '2026-10-08',
    scenario_id: scenarioId,
    is_simulated: true,
    requested_budget_m3: budget,
    total_allocated_m3: totalAlloc,
    unallocated_remainder_m3: Math.max(0, budget - totalAlloc),
    budget_utilization_pct: Math.min(100.0, (totalAlloc / (budget || 1)) * 100),
    constraint_checks: {
      budget_conserved: true,
      all_allocations_non_negative: true,
      capacities_respected: true
    },
    allocations: allocs,
    baseline_comparison: {
      baseline_method: 'fixed_equal',
      total_budget_m3: budget,
      ai_allocated_total_m3: totalAlloc,
      baseline_allocated_total_m3: budget,
      ai_high_risk_allocation_m3: totalAlloc * 0.7,
      baseline_high_risk_allocation_m3: budget * 0.2,
      ai_high_risk_share_pct: 70.0,
      baseline_high_risk_share_pct: 20.0,
      top_stressed_fields_funded_ai: 2,
      top_stressed_fields_funded_baseline: 1,
      narrative: 'AI water plan prioritized scarce water to High-risk fields compared to equal share.'
    },
    disclaimer: 'Mock demonstration water allocation.'
  };
}

export const mockEvents: ActionEventResponse[] = [
  {
    event_id: 'evt-mock-001',
    field_id: 'PC-001',
    timestamp: '2026-10-08T08:00:00Z',
    recommended_action: 'irrigate_now',
    action_taken: 'irrigate',
    followed_recommendation: true,
    planned_volume_m3: 18.5,
    actual_volume_m3: 18.5,
    user_role: 'operator',
    status: 'logged'
  },
  {
    event_id: 'evt-mock-002',
    field_id: 'PC-006',
    timestamp: '2026-10-08T09:30:00Z',
    recommended_action: 'irrigate_now',
    action_taken: 'wait',
    followed_recommendation: false,
    override_reason: 'pump_maintenance',
    planned_volume_m3: 20.0,
    actual_volume_m3: 0.0,
    user_role: 'farmer',
    status: 'logged'
  }
];

export const mockMetrics: SystemMetricsResponse = {
  total_fields: 10,
  total_observations: 170,
  total_events_logged: 2,
  overrides_logged: 1,
  adherence_rate_pct: 50.0,
  override_reasons_breakdown: { pump_maintenance: 1 },
  risk_distribution: { green: 3, amber: 5, red: 2 },
  active_scenario: 'normal_01',
  database_type: 'mock-static'
};
