export interface HealthResponse {
  status: string;
  app: string;
  environment: string;
  version: string;
  database: string;
}

export interface FieldProperties {
  id: string;
  name: string;
  crop: string;
  stage: string;
  area_acres: number;
  area_ha?: number;
  stress_status?: 'green' | 'amber' | 'red' | 'blue';
  stress_probability?: number;
  recommended_action?: 'irrigate_now' | 'wait' | 'inspect' | 'protect_pause' | string;
}

export interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface FieldFeature {
  type: 'Feature';
  id?: string;
  properties: FieldProperties;
  geometry: GeoJSONPolygon;
}

export interface FieldFeatureCollection {
  type: 'FeatureCollection';
  features: FieldFeature[];
}

export interface SignalContribution {
  signal_name: string;
  observed_value: number;
  unit: string;
  contribution_points: number;
  direction: 'increases_stress' | 'decreases_stress' | 'neutral' | string;
  statement: string;
}

export interface DataFreshnessIndicator {
  variable: string;
  source: string;
  observed_at: string;
  age_days: number;
  quality_flag: string;
  is_stale: boolean;
}

export interface FieldAssessmentResponse {
  field_id: string;
  field_name: string;
  crop: string;
  stage: string;
  area_acres: number;
  area_ha: number;
  as_of_date: string;
  risk_score: number;
  stress_index: number;
  risk_level: 'Low' | 'Moderate' | 'High' | 'Critical' | string;
  stress_status: 'green' | 'amber' | 'red' | 'blue' | string;
  recommended_action: 'irrigate_now' | 'wait' | 'inspect' | 'protect_pause' | string;
  action_window: string;
  recommended_volume_m3: number;
  confidence: number;
  is_simulated: boolean;
  active_scenario: string;
  drivers: SignalContribution[];
  freshness_table: DataFreshnessIndicator[];
  warnings: string[];
  policy_disclaimer: string;
}

export interface DailyForecastPoint {
  day_offset: number;
  date: string;
  projected_risk_score: number;
  projected_stress_index: number;
  projected_status: 'green' | 'amber' | 'red' | 'blue' | string;
  projected_soil_moisture: number;
  forecast_tmax: number;
  forecast_rainfall: number;
  confidence_p10: number;
  confidence_p90: number;
}

export interface FieldForecastResponse {
  field_id: string;
  field_name: string;
  horizon_days: number;
  as_of_date: string;
  daily_projections: DailyForecastPoint[];
  influencing_inputs: string[];
  model_version: string;
  data_freshness_warning?: string | null;
  limitations_disclaimer: string;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  title: string;
  description: string;
  scenario_type: string;
  intensity?: string;
  affected_field_ids: string[];
}

export interface ScenarioListResponse {
  count: number;
  scenarios: ScenarioDefinition[];
}

export interface ScenarioSignalDiff {
  variable: string;
  unit: string;
  baseline_value: number;
  simulated_value: number;
  difference: number;
  description: string;
}

export interface FieldStatusDiff {
  field_id: string;
  field_name: string;
  baseline_score: number;
  simulated_score: number;
  baseline_status: string;
  simulated_status: string;
  baseline_action: string;
  simulated_action: string;
  changed: boolean;
}

export interface ScenarioReplayResponse {
  scenario_id: string;
  name: string;
  title: string;
  description: string;
  scenario_type: string;
  is_synthetic_replay: boolean;
  affected_field_ids: string[];
  signals_changed: ScenarioSignalDiff[];
  fields_affected_count: number;
  field_status_diffs: FieldStatusDiff[];
  summary_narrative: string;
}

export interface FieldAllocation {
  field_id: string;
  field_name: string;
  priority_rank: number;
  risk_score: number;
  risk_level: string;
  stress_status: string;
  requested_demand_m3: number;
  allocated_volume_m3: number;
  capacity_limit_m3: number;
  allocation_percentage: number;
  action_recommendation: string;
  reason: string;
  warnings: string[];
}

export interface BaselineComparison {
  baseline_method: string;
  total_budget_m3: number;
  ai_allocated_total_m3: number;
  baseline_allocated_total_m3: number;
  ai_high_risk_allocation_m3: number;
  baseline_high_risk_allocation_m3: number;
  ai_high_risk_share_pct: number;
  baseline_high_risk_share_pct: number;
  top_stressed_fields_funded_ai: number;
  top_stressed_fields_funded_baseline: number;
  narrative: string;
}

export interface WaterPlanResponse {
  plan_id: string;
  as_of_date: string;
  scenario_id: string;
  is_simulated: boolean;
  requested_budget_m3: number;
  total_allocated_m3: number;
  unallocated_remainder_m3: number;
  budget_utilization_pct: number;
  constraint_checks: Record<string, boolean>;
  allocations: FieldAllocation[];
  baseline_comparison: BaselineComparison;
  disclaimer: string;
}

export interface ActionEventRequest {
  field_id: string;
  action_taken: string;
  followed_recommendation: boolean;
  override_reason?: string | null;
  planned_volume_m3?: number | null;
  actual_volume_m3?: number | null;
  user_role: string;
  notes?: string | null;
}

export interface ActionEventResponse {
  event_id: string;
  field_id: string;
  timestamp: string;
  recommended_action: string;
  action_taken: string;
  followed_recommendation: boolean;
  override_reason?: string | null;
  planned_volume_m3?: number | null;
  actual_volume_m3?: number | null;
  user_role: string;
  status: string;
}

export interface SystemMetricsResponse {
  total_fields: number;
  total_observations: number;
  total_events_logged: number;
  overrides_logged: number;
  adherence_rate_pct: number;
  override_reasons_breakdown: Record<string, number>;
  risk_distribution: Record<string, number>;
  active_scenario: string;
  database_type: string;
}
