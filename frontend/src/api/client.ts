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

const defaultApiUrl = typeof window !== 'undefined' && window.location.hostname === '127.0.0.1'
  ? 'http://127.0.0.1:8000'
  : 'http://localhost:8000';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || defaultApiUrl;

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

  async checkHealth(): Promise<HealthResponse> {
    return request<HealthResponse>('/health');
  },

  async getFields(scenarioId?: string): Promise<FieldFeatureCollection> {
    const qs = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
    return request<FieldFeatureCollection>(`/fields${qs}`);
  },

  async getField(fieldId: string, scenarioId?: string): Promise<FieldFeature> {
    const qs = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
    return request<FieldFeature>(`/fields/${encodeURIComponent(fieldId)}${qs}`);
  },

  async getFieldStatus(fieldId: string, scenarioId?: string): Promise<FieldAssessmentResponse> {
    const qs = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
    return request<FieldAssessmentResponse>(`/fields/${encodeURIComponent(fieldId)}/status${qs}`);
  },

  async getExplain(fieldId: string, scenarioId?: string): Promise<FieldAssessmentResponse> {
    const qs = scenarioId ? `?scenario_id=${encodeURIComponent(scenarioId)}` : '';
    return request<FieldAssessmentResponse>(`/explain/${encodeURIComponent(fieldId)}${qs}`);
  },

  async getForecast(fieldId: string, horizonDays: number = 7, scenarioId?: string): Promise<FieldForecastResponse> {
    const params = new URLSearchParams({ horizon_days: horizonDays.toString() });
    if (scenarioId) params.append('scenario_id', scenarioId);
    return request<FieldForecastResponse>(`/forecast/${encodeURIComponent(fieldId)}?${params.toString()}`);
  },

  async getScenarios(): Promise<ScenarioListResponse> {
    return request<ScenarioListResponse>('/scenarios');
  },

  async replayScenario(scenarioId: string): Promise<ScenarioReplayResponse> {
    return request<ScenarioReplayResponse>('/scenario/replay', {
      method: 'POST',
      body: JSON.stringify({ scenario_id: scenarioId }),
    });
  },

  async resetScenario(): Promise<ScenarioReplayResponse> {
    return request<ScenarioReplayResponse>('/scenario/reset', {
      method: 'POST',
    });
  },

  async createWaterPlan(budget: number, scenarioId?: string, method: string = 'ai'): Promise<WaterPlanResponse> {
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
    return request<ActionEventResponse>('/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  async getEvents(limit: number = 50): Promise<ActionEventResponse[]> {
    return request<ActionEventResponse[]>(`/events?limit=${limit}`);
  },

  async getMetrics(): Promise<SystemMetricsResponse> {
    return request<SystemMetricsResponse>('/metrics');
  },
};
