import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import {
  FieldForecastResponse,
  FieldFeatureCollection,
} from '../types/api';
import {
  TrendingUp,
  CloudRain,
  Sun,
  Droplets,
  AlertTriangle,
  Info,
  Layers
} from 'lucide-react';

interface ForecastViewProps {
  fields: FieldFeatureCollection | null;
  selectedFieldId: string;
  scenarioId: string;
  onSelectField: (fieldId: string) => void;
}

export const ForecastView: React.FC<ForecastViewProps> = ({
  fields,
  selectedFieldId,
  scenarioId,
  onSelectField,
}) => {
  const [horizonDays, setHorizonDays] = useState<number>(7);
  const [forecast, setForecast] = useState<FieldForecastResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchForecast = useCallback(async (fieldId: string, days: number, scenId: string) => {
    if (!fieldId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getForecast(fieldId, days, scenId);
      setForecast(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch field forecast';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFieldId) {
      fetchForecast(selectedFieldId, horizonDays, scenarioId);
    }
  }, [selectedFieldId, horizonDays, scenarioId, fetchForecast]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'red':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">High / Crit</span>;
      case 'amber':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Moderate</span>;
      case 'blue':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Paused</span>;
      case 'green':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Nominal</span>;
    }
  };

  const peakRiskScore = forecast?.daily_projections
    ? Math.max(...forecast.daily_projections.map((p) => p.projected_risk_score))
    : 0;

  const totalForecastRain = forecast?.daily_projections
    ? forecast.daily_projections.reduce((acc, p) => acc + p.forecast_rainfall, 0)
    : 0;

  return (
    <div className="space-y-6">
      {/* Forecast Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Field Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
            Target Field:
          </label>
          <select
            value={selectedFieldId}
            onChange={(e) => onSelectField(e.target.value)}
            className="text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
          >
            {fields?.features?.map((feat) => (
              <option key={feat.properties.id} value={feat.properties.id}>
                {feat.properties.id} — {feat.properties.name} ({feat.properties.crop})
              </option>
            ))}
          </select>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Planning Horizon:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
            {[3, 5, 7].map((days) => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
                  horizonDays === days
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Simulating {horizonDays}-day crop evapotranspiration & soil moisture depletion...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-red-700 text-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Forecast calculation failed</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {forecast && !loading && (
        <>
          {/* Freshness Warning if applicable */}
          {forecast.data_freshness_warning && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Input Freshness Note: </span>
                <span>{forecast.data_freshness_warning}</span>
              </div>
            </div>
          )}

          {/* Key Trajectory Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Trajectory Horizon</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 flex items-baseline gap-1">
                {forecast.horizon_days} <span className="text-xs font-semibold text-slate-400">Days</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                As-of: {forecast.as_of_date}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Peak Risk Score</div>
              <div className="text-2xl font-bold text-slate-800 mt-1 flex items-baseline gap-1">
                {peakRiskScore.toFixed(1)} <span className="text-xs font-mono text-slate-400">/100</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Highest projected risk
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total Forecast Rain</div>
              <div className="text-2xl font-bold text-teal-700 mt-1 flex items-baseline gap-1">
                {totalForecastRain.toFixed(1)} <span className="text-xs font-semibold text-slate-400">mm</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Cumulative precipitation
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Model Engine</div>
              <div className="text-sm font-mono font-bold text-slate-700 mt-2 truncate">
                {forecast.model_version}
              </div>
              <div className="text-[11px] text-emerald-600 font-medium mt-1">
                Deterministic ET₀ depletion
              </div>
            </div>
          </div>

          {/* Day-by-Day Forecast Timeline Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-teal-600" />
                <h3 className="text-sm font-bold text-slate-800">
                  Day-by-Day Projected Stress Trajectory & Uncertainty Envelope [p10, p90]
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500">
                {forecast.field_name} ({forecast.field_id})
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {forecast.daily_projections.map((p) => (
                <div
                  key={p.day_offset}
                  className="bg-slate-50/70 rounded-xl p-4 border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:bg-slate-50"
                >
                  {/* Date & Day Indicator */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="w-10 h-10 rounded-xl bg-teal-100/80 text-teal-900 font-extrabold flex flex-col items-center justify-center text-xs shrink-0 border border-teal-200">
                      <span>D+{p.day_offset}</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{p.date}</div>
                      <div className="mt-0.5">{getStatusBadge(p.projected_status)}</div>
                    </div>
                  </div>

                  {/* Risk Score & Uncertainty Interval Meter */}
                  <div className="flex-1 max-w-md">
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="font-semibold text-slate-700">
                        Projected Risk: <span className="font-bold text-slate-900">{p.projected_risk_score.toFixed(1)}</span>
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        Envelope: [{p.confidence_p10.toFixed(1)} – {p.confidence_p90.toFixed(1)}]
                      </span>
                    </div>

                    {/* Visual Interval Bar */}
                    <div className="relative w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      {/* Uncertainty Shading */}
                      <div
                        className="absolute h-3 bg-teal-200/60 rounded-full"
                        style={{
                          left: `${Math.max(0, p.confidence_p10)}%`,
                          width: `${Math.min(100, p.confidence_p90 - p.confidence_p10)}%`,
                        }}
                      ></div>
                      {/* Mean Point */}
                      <div
                        className={`h-3 rounded-full ${
                          p.projected_status === 'red'
                            ? 'bg-red-500'
                            : p.projected_status === 'amber'
                            ? 'bg-amber-500'
                            : p.projected_status === 'blue'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(3, p.projected_risk_score))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Agronomic & Weather Signals */}
                  <div className="grid grid-cols-3 gap-3 text-xs min-w-[280px] bg-white p-2.5 rounded-lg border border-slate-200">
                    <div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-teal-600" />
                        <span>Soil Moisture</span>
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {(p.projected_soil_moisture * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <Sun className="w-3 h-3 text-amber-500" />
                        <span>Max Temp</span>
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {p.forecast_tmax}°C
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <CloudRain className="w-3 h-3 text-blue-500" />
                        <span>Rainfall</span>
                      </div>
                      <div className="font-bold text-slate-800 mt-0.5">
                        {p.forecast_rainfall} mm
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Influencing Signals List */}
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Influencing Model Inputs:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {forecast.influencing_inputs.map((inp, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {inp}
                </span>
              ))}
            </div>
          </div>

          {/* Heuristic Projection Disclaimer */}
          <div className="p-3 bg-slate-100 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{forecast.limitations_disclaimer}</span>
          </div>
        </>
      )}
    </div>
  );
};
