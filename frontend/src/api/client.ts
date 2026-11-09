import {
  HealthResponse,
  FieldFeatureCollection,
  FieldFeature,
  FieldAssessmentResponse,
  FieldForecastResponse,
  ScenarioListResponse,
  ScenarioReplayResponse,
  WaterPlanResponse,
  ActionEventRequest,
  ActionEventResponse,
  SystemMetricsResponse
} from '../types/api';
import {
  mockHealth,
  mockFields,
  mockScenarios,
  getMockAssessment,
  getMockForecast,
  getMockWaterPlan,
  mockEvents,
  mockMetrics
} from './mockData';

const defaultApiUrl = typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'http://localhost:8000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiUrl;

let mockModeActive = (typeof window !== 'undefined' && localStorage.getItem('jalsetu_mock_mode') === 'true') ||
  import.meta.env.VITE_MOCK_MODE === 'true';

export const isMockMode = (): boolean => mockModeActive;
export const setMockMode = (enabled: boolean): void => {
  mockModeActive = enabled;
  if (typeof window !== 'undefined') {
    localStorage.setItem('jalsetu_mock_mode', enabled ? 'true' : 'false');
  }
};

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!res.ok) {
      const errText = await res.text();
      let detail = errText;
      try {
        const parsed = JSON.parse(errText);
        detail = parsed.detail || parsed.message || errText;
      } catch {
        // Keep raw text
      }
      throw new ApiError(`HTTP ${res.status}: ${detail}`, res.status);
    }

    return await res.json() as T;
  } catch (err: unknown) {
    if (err instanceof ApiError) throw err;
    const msg = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(`Unable to connect to backend service at ${API_BASE_URL}: ${msg}`);
  }
}

export const api = {
  baseUrl: API_BASE_URL,
  isMockMode,
  setMockMode,

  async checkHealth(): Promise<HealthResponse> {
    if (mockModeActive) return mockHealth;
    return request<HealthResponse>('/health');
  },

  async getFields(scenarioId?: string): Promise<FieldFeatureCollection> {
    if (mockModeActive) {
      return {
        ...mockFields,
        features: mockFields.features.map(f => {
          const isPaused = (scenarioId === 'heavy_rain_pause_01');
          const isShock = (scenarioId === 'rainfall_deficit_heat_01' && f.properties.id === 'PC-001');
          return {
            ...f,
            properties: {
              ...f.properties,
              stress_status: isPaused ? 'blue' : isShock ? 'red' : f.properties.stress_status,
              recommended_action: isPaused ? 'protect_pause' : isShock ? 'irrigate_now' : f.properties.recommended_action
            }
          };
        })
      };
    }
    const qs = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
    return request<FieldFeatureCollection>(`/fields${qs}`);
  },

  async getField(fieldId: string, scenarioId?: string): Promise<FieldFeature> {
    if (mockModeActive) {
      const feat = mockFields.features.find(f => f.properties.id === fieldId);
      if (!feat) throw new ApiError(`Field ${fieldId} not found in mock data`, 404);
      return feat;
    }
    const qs = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
    return request<FieldFeature>(`/fields/${encodeURIComponent(fieldId)}${qs}`);
  },

  async getFieldStatus(fieldId: string, scenarioId?: string): Promise<FieldAssessmentResponse> {
    if (mockModeActive) {
      return getMockAssessment(fieldId, scenarioId);
    }
    const qs = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
    return request<FieldAssessmentResponse>(`/fields/${encodeURIComponent(fieldId)}/status${qs}`);
  },

  async getExplain(fieldId: string, scenarioId?: string): Promise<FieldAssessmentResponse> {
    if (mockModeActive) {
      return getMockAssessment(fieldId, scenarioId);
    }
    const qs = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
    return request<FieldAssessmentResponse>(`/explain/${encodeURIComponent(fieldId)}${qs}`);
  },

  async getForecast(fieldId: string, horizonDays: number = 7, scenarioId?: string): Promise<FieldForecastResponse> {
    if (mockModeActive) {
      return getMockForecast(fieldId, horizonDays);
    }
    const params = new URLSearchParams({ horizon_days: horizonDays.toString() });
    if (scenarioId) params.append('scenario_id', scenarioId);
    return request<FieldForecastResponse>(`/forecast/${encodeURIComponent(fieldId)}?${params.toString()}`);
  },

  async getScenarios(): Promise<ScenarioListResponse> {
    if (mockModeActive) return mockScenarios;
    return request<ScenarioListResponse>('/scenarios');
  },

  async replayScenario(scenarioId: string): Promise<ScenarioReplayResponse> {
    if (mockModeActive) {
      const scen = mockScenarios.scenarios.find(s => s.id === scenarioId);
      return {
        scenario_id: scenarioId,
        name: scenarioId,
        title: scen?.title || scenarioId,
        description: scen?.description || 'Simulated replay scenario',
        scenario_type: scen?.scenario_type || 'shock',
        is_synthetic_replay: true,
        affected_field_ids: scen?.affected_field_ids || [],
        signals_changed: [
          { variable: 'canopy_temp', unit: '°C', baseline_value: 30.5, simulated_value: 34.5, difference: 4.0, description: '+4°C thermal transpiration shock' }
        ],
        fields_affected_count: scen?.affected_field_ids?.length || 3,
        field_status_diffs: [
          { field_id: 'PC-001', field_name: 'Field 01', baseline_score: 55.6, simulated_score: 82.0, baseline_status: 'amber', simulated_status: 'red', baseline_action: 'wait', simulated_action: 'irrigate_now', changed: true }
        ],
        summary_narrative: `Mock replay of ${scen?.title || scenarioId}: Replay diff calculated successfully.`
      };
    }
    return request<ScenarioReplayResponse>('/scenario/replay', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
  },

  async resetScenario(): Promise<ScenarioReplayResponse> {
    if (mockModeActive) {
      return {
        scenario_id: 'normal_01',
        name: 'normal_01',
        title: 'Baseline Seasonal Weather',
        description: 'Standard historical dry season climate conditions.',
        scenario_type: 'baseline',
        is_synthetic_replay: false,
        affected_field_ids: [],
        signals_changed: [],
        fields_affected_count: 0,
        field_status_diffs: [],
        summary_narrative: 'Reset to normal baseline conditions.'
      };
    }
    return request<ScenarioReplayResponse>('/scenario/reset', {
      method: 'POST',
    });
  },

  async createWaterPlan(budget: number, scenarioId?: string, method: string = 'ai'): Promise<WaterPlanResponse> {
    if (mockModeActive) {
      return getMockWaterPlan(budget, scenarioId);
    }
    return request<WaterPlanResponse>('/water-plan', {
      method: 'POST',
      body: JSON.stringify({
        budget,
        scenario_id: scenarioId || undefined,
        method,
      }),
    });
  },

  async recordEvent(event: ActionEventRequest): Promise<ActionEventResponse> {
    if (mockModeActive) {
      const newEvt: ActionEventResponse = {
        event_id: `evt-mock-${Date.now()}`,
        field_id: event.field_id,
        timestamp: new Date().toISOString(),
        recommended_action: 'irrigate_now',
        action_taken: event.action_taken,
        followed_recommendation: event.followed_recommendation,
        override_reason: event.override_reason,
        planned_volume_m3: event.planned_volume_m3,
        actual_volume_m3: event.actual_volume_m3,
        user_role: event.user_role,
        status: 'logged'
      };
      mockEvents.unshift(newEvt);
      mockMetrics.total_events_logged += 1;
      if (!event.followed_recommendation) mockMetrics.overrides_logged += 1;
      return newEvt;
    }
    return request<ActionEventResponse>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  async getEvents(limit: number = 50): Promise<ActionEventResponse[]> {
    if (mockModeActive) {
      return mockEvents.slice(0, limit);
    }
    return request<ActionEventResponse[]>(`/events?limit=${limit}`);
  },

  async getMetrics(): Promise<SystemMetricsResponse> {
    if (mockModeActive) return mockMetrics;
    return request<SystemMetricsResponse>('/metrics');
  },
};
