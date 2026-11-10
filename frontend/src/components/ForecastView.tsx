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
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D32F2F]/15 text-[#D32F2F] border border-[#D32F2F]/30">High / Crit</span>;
      case 'amber':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/40">Moderate</span>;
      case 'blue':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#299BCB]/15 text-[#123B66] border border-[#299BCB]/30">Paused</span>;
      case 'green':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#438653]/15 text-[#245C38] border border-[#438653]/30">Low / Nominal</span>;
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
      {/* Editorial Hero Banner with Agricultural Photo */}
      <div className="relative rounded-2xl overflow-hidden shadow-ocean-md border border-[#E2E8F0]">
        <img
          src="/images/hero-forecast.jpg"
          alt="Agricultural horizon under changing sky"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="relative bg-gradient-to-r from-[#123B66]/95 via-[#123B66]/85 to-[#299BCB]/75 p-6 sm:p-8 text-white">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#299BCB]/30 text-[#DCEFF8] backdrop-blur-xs border border-[#76C4E5]/40">
              <TrendingUp className="w-3.5 h-3.5 text-[#76C4E5]" /> Multi-Horizon Evapotranspiration Projections
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              3–7 Day Crop Water-Stress Trajectories
            </h1>
            <p className="text-xs sm:text-sm text-[#DCEFF8]/90 leading-relaxed">
              Transparent, deterministic projections of daily soil moisture depletion and atmospheric heat load with uncertainty envelopes $[p_{10}, p_{90}]$ across the planning window.
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Controls Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-ocean-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Field Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <label className="text-xs font-bold text-[#123B66] whitespace-nowrap">
            Monitored Field:
          </label>
          <select
            value={selectedFieldId}
            onChange={(e) => onSelectField(e.target.value)}
            className="text-xs sm:text-sm bg-[#F5F8FC] border border-[#CBD5E1] rounded-xl px-3.5 py-2 font-semibold text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
          >
            {fields?.features?.map((feat) => (
              <option key={feat.properties.id} value={feat.properties.id}>
                {feat.properties.id} — {feat.properties.name} ({feat.properties.crop})
              </option>
            ))}
          </select>
        </div>

        {/* Horizon Selector */}
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-[#64748B]">Planning Horizon:</span>
          <div className="flex items-center gap-1.5 bg-[#F5F8FC] p-1 rounded-xl border border-[#E2E8F0]">
            {[3, 5, 7].map((days) => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                className={`font-inter font-semibold text-[14px] px-4 py-1.5 rounded-xl transition-all duration-150 inline-flex items-center justify-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 ${
                  horizonDays === days
                    ? 'bg-[#299BCB] hover:bg-[#2184AD] text-white shadow-ocean-sm border border-transparent'
                    : 'bg-white hover:bg-[#F5F8FC] text-[#123B66] hover:text-[#123B66] border border-[#CBD5E1] hover:border-[#299BCB]'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-16 border border-[#E2E8F0] text-center text-[#64748B] text-xs flex flex-col items-center justify-center gap-3 shadow-ocean-sm">
          <div className="w-8 h-8 border-3 border-[#299BCB] border-t-transparent rounded-full animate-spin"></div>
          <span>Simulating {horizonDays}-day crop evapotranspiration & soil moisture depletion...</span>
        </div>
      )}

      {error && (
        <div className="bg-[#D32F2F]/10 border border-[#D32F2F]/30 rounded-2xl p-5 text-[#D32F2F] text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#D32F2F]" />
          <div>
            <p className="font-bold">Forecast calculation failed</p>
            <p className="text-xs mt-1">{error}</p>
          </div>
        </div>
      )}

      {forecast && !loading && (
        <>
          {/* Freshness Warning if applicable */}
          {forecast.data_freshness_warning && (
            <div className="bg-[#D97706]/15 border border-[#D97706]/40 rounded-2xl p-3.5 text-xs text-[#92400E] flex items-start gap-2.5 shadow-ocean-sm">
              <AlertTriangle className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#123B66]">Input Freshness Note: </span>
                <span>{forecast.data_freshness_warning}</span>
              </div>
            </div>
          )}

          {/* Key Trajectory Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-ocean-sm">
              <div className="text-xs text-[#64748B] font-medium">Trajectory Horizon</div>
              <div className="text-2xl font-bold text-[#123B66] font-display mt-1 flex items-baseline gap-1">
                {forecast.horizon_days} <span className="text-xs font-semibold text-[#64748B]">Days</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                As-of: {forecast.as_of_date}
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-ocean-sm">
              <div className="text-xs text-[#64748B] font-medium">Peak Risk Score</div>
              <div className="text-2xl font-bold text-[#D32F2F] font-display mt-1 flex items-baseline gap-1">
                {peakRiskScore.toFixed(1)} <span className="text-xs font-mono text-[#64748B]">/100</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Highest projected risk
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-ocean-sm">
              <div className="text-xs text-[#64748B] font-medium">Total Forecast Rain</div>
              <div className="text-2xl font-bold text-[#299BCB] font-display mt-1 flex items-baseline gap-1">
                {totalForecastRain.toFixed(1)} <span className="text-xs font-semibold text-[#64748B]">mm</span>
              </div>
              <div className="text-[11px] text-[#64748B] mt-1">
                Cumulative precipitation
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#E2E8F0] shadow-ocean-sm">
              <div className="text-xs text-[#64748B] font-medium">Model Engine</div>
              <div className="text-sm font-mono font-bold text-[#123B66] mt-2 truncate">
                {forecast.model_version}
              </div>
              <div className="text-[11px] text-[#438653] font-bold mt-1">
                Deterministic ET₀ depletion
              </div>
            </div>
          </div>

          {/* Day-by-Day Forecast Timeline Cards */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-ocean-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F5F8FC] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-[#299BCB]" />
                <h3 className="text-sm font-bold text-[#123B66] font-display">
                  Day-by-Day Projected Stress Trajectory & Uncertainty Envelope [p10, p90]
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#245C38] bg-[#E8F2E5] px-2.5 py-1 rounded-md border border-[#78AD76]/40">
                {forecast.field_name} ({forecast.field_id})
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {forecast.daily_projections.map((p) => (
                <div
                  key={p.day_offset}
                  className="bg-[#F5F8FC] rounded-2xl p-4 border border-[#E2E8F0] flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:border-[#76C4E5]"
                >
                  {/* Date & Day Indicator */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#123B66] to-[#299BCB] text-white font-bold flex flex-col items-center justify-center text-xs shrink-0 shadow-ocean-sm">
                      <span>D+{p.day_offset}</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#0F172A]">{p.date}</div>
                      <div className="mt-0.5">{getStatusBadge(p.projected_status)}</div>
                    </div>
                  </div>

                  {/* Risk Score & Uncertainty Interval Meter (Blue Percentage Bar - Part 3) */}
                  <div className="flex-1 max-w-md">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-[#0F172A]">
                        Projected Risk: <span className="font-extrabold font-mono text-[#1976B9]">{p.projected_risk_score.toFixed(1)}%</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#64748B]">
                        Envelope: [{p.confidence_p10.toFixed(1)} – {p.confidence_p90.toFixed(1)}]
                      </span>
                    </div>

                    {/* Percentage Bar in Shades of Blue with Pale Blue Track */}
                    <div className="relative w-full bg-[#DCEFF8] rounded-full h-3 overflow-hidden">
                      {/* Uncertainty Shading */}
                      <div
                        className="absolute h-3 bg-[#76C4E5]/40 rounded-full"
                        style={{
                          left: `${Math.max(0, p.confidence_p10)}%`,
                          width: `${Math.min(100, p.confidence_p90 - p.confidence_p10)}%`,
                        }}
                      ></div>
                      {/* Blue Bar Fill */}
                      <div
                        className="h-3 rounded-full bg-[#1976B9] transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(4, p.projected_risk_score))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Agronomic & Weather Signals */}
                  <div className="grid grid-cols-3 gap-3 text-xs min-w-[280px] bg-white p-2.5 rounded-xl border border-[#E2E8F0]">
                    <div>
                      <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-[#299BCB]" />
                        <span>Soil Moisture</span>
                      </div>
                      <div className="font-bold text-[#1976B9] mt-0.5 font-mono">
                        {(p.projected_soil_moisture * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <Sun className="w-3 h-3 text-[#D97706]" />
                        <span>Max Temp</span>
                      </div>
                      <div className="font-bold text-[#0F172A] mt-0.5 font-mono">
                        {p.forecast_tmax}°C
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#64748B] flex items-center gap-1">
                        <CloudRain className="w-3 h-3 text-[#123B66]" />
                        <span>Rainfall</span>
                      </div>
                      <div className="font-bold text-[#0F172A] mt-0.5 font-mono">
                        {p.forecast_rainfall} mm
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Influencing Signals List with Agricultural Green Highlights */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-[#E2E8F0] shadow-ocean-sm">
            <div className="text-xs font-bold text-[#123B66] mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#299BCB]" />
              <span>Influencing Model Inputs:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {forecast.influencing_inputs.map((inp, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-[#E8F2E5] text-[#245C38] border border-[#78AD76]/40"
                >
                  {inp}
                </span>
              ))}
            </div>
          </div>

          {/* Heuristic Projection Disclaimer */}
          <div className="p-3.5 bg-[#F5F8FC] rounded-2xl text-[11px] text-[#64748B] flex items-start gap-2.5 border border-[#E2E8F0]">
            <Info className="w-4 h-4 text-[#299BCB] shrink-0 mt-0.5" />
            <span>{forecast.limitations_disclaimer}</span>
          </div>
        </>
      )}
    </div>
  );
};
