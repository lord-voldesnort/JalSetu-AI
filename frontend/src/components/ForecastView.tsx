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
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B95B55]/15 text-[#8A3C37] border border-[#B95B55]/30">High / Crit</span>;
      case 'amber':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E5B94B]/20 text-[#69483A] border border-[#E5B94B]/40">Moderate</span>;
      case 'blue':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">Paused</span>;
      case 'green':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#85845A]/15 text-[#585736] border border-[#85845A]/30">Nominal</span>;
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
      <div className="relative rounded-2xl overflow-hidden shadow-warm-md border border-[#E8D6C5]">
        <img
          src="/images/hero-forecast.jpg"
          alt="Agricultural horizon under changing sky"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            // Elegant ivory fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="relative bg-gradient-to-r from-[#382A25]/95 via-[#382A25]/85 to-[#69483A]/70 p-6 sm:p-8 text-[#FFFCF6]">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C96D3B]/30 text-[#E8D6C5] backdrop-blur-xs border border-[#C96D3B]/40">
              <TrendingUp className="w-3.5 h-3.5 text-[#E5B94B]" /> Multi-Horizon Evapotranspiration Projections
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#FFFCF6]">
              3–7 Day Crop Water-Stress Trajectories
            </h1>
            <p className="text-xs sm:text-sm text-[#E8D6C5]/90 leading-relaxed">
              Transparent, deterministic projections of daily soil moisture depletion and atmospheric heat load with uncertainty envelopes $[p_{10}, p_{90}]$ across the planning window.
            </p>
          </div>
        </div>
      </div>

      {/* Forecast Controls Bar */}
      <div className="bg-[#FFFCF6] rounded-2xl p-4 sm:p-5 border border-[#E8D6C5] shadow-warm-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Field Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
          <label className="text-xs font-bold text-[#382A25] whitespace-nowrap">
            Monitored Field:
          </label>
          <select
            value={selectedFieldId}
            onChange={(e) => onSelectField(e.target.value)}
            className="text-xs sm:text-sm bg-[#FAF5ED] border border-[#E8D6C5] rounded-xl px-3.5 py-2 font-semibold text-[#2C201C] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
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
          <span className="text-xs font-bold text-[#817064]">Planning Horizon:</span>
          <div className="flex items-center gap-1.5 bg-[#FAF5ED] p-1 rounded-xl border border-[#E8D6C5]">
            {[3, 5, 7].map((days) => (
              <button
                key={days}
                onClick={() => setHorizonDays(days)}
                className={`font-inter font-semibold text-[14px] px-4 py-1.5 rounded-xl transition-all duration-150 inline-flex items-center justify-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40 ${
                  horizonDays === days
                    ? 'bg-[#C96D3B] hover:bg-[#B35E30] text-[#FFFCF6] shadow-warm-sm border border-transparent'
                    : 'bg-[#FFFCF6] hover:bg-[#FAF5ED] text-[#69483A] hover:text-[#382A25] border border-[#E8D6C5] hover:border-[#D99A91]'
                }`}
              >
                {days} Days
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-[#FFFCF6] rounded-2xl p-16 border border-[#E8D6C5] text-center text-[#817064] text-xs flex flex-col items-center justify-center gap-3 shadow-warm-sm">
          <div className="w-8 h-8 border-3 border-[#C96D3B] border-t-transparent rounded-full animate-spin"></div>
          <span>Simulating {horizonDays}-day crop evapotranspiration & soil moisture depletion...</span>
        </div>
      )}

      {error && (
        <div className="bg-[#B95B55]/10 border border-[#B95B55]/30 rounded-2xl p-5 text-[#8A3C37] text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#B95B55]" />
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
            <div className="bg-[#E5B94B]/15 border border-[#E5B94B]/40 rounded-2xl p-3.5 text-xs text-[#69483A] flex items-start gap-2.5 shadow-warm-sm">
              <AlertTriangle className="w-4 h-4 text-[#C96D3B] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#382A25]">Input Freshness Note: </span>
                <span>{forecast.data_freshness_warning}</span>
              </div>
            </div>
          )}

          {/* Key Trajectory Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-[#FFFCF6] p-4 sm:p-5 rounded-2xl border border-[#E8D6C5] shadow-warm-sm">
              <div className="text-xs text-[#817064] font-medium">Trajectory Horizon</div>
              <div className="text-2xl font-bold text-[#382A25] font-display mt-1 flex items-baseline gap-1">
                {forecast.horizon_days} <span className="text-xs font-semibold text-[#817064]">Days</span>
              </div>
              <div className="text-[11px] text-[#9D8D82] mt-1">
                As-of: {forecast.as_of_date}
              </div>
            </div>

            <div className="bg-[#FFFCF6] p-4 sm:p-5 rounded-2xl border border-[#E8D6C5] shadow-warm-sm">
              <div className="text-xs text-[#817064] font-medium">Peak Risk Score</div>
              <div className="text-2xl font-bold text-[#B95B55] font-display mt-1 flex items-baseline gap-1">
                {peakRiskScore.toFixed(1)} <span className="text-xs font-mono text-[#817064]">/100</span>
              </div>
              <div className="text-[11px] text-[#9D8D82] mt-1">
                Highest projected risk
              </div>
            </div>

            <div className="bg-[#FFFCF6] p-4 sm:p-5 rounded-2xl border border-[#E8D6C5] shadow-warm-sm">
              <div className="text-xs text-[#817064] font-medium">Total Forecast Rain</div>
              <div className="text-2xl font-bold text-[#C96D3B] font-display mt-1 flex items-baseline gap-1">
                {totalForecastRain.toFixed(1)} <span className="text-xs font-semibold text-[#817064]">mm</span>
              </div>
              <div className="text-[11px] text-[#9D8D82] mt-1">
                Cumulative precipitation
              </div>
            </div>

            <div className="bg-[#FFFCF6] p-4 sm:p-5 rounded-2xl border border-[#E8D6C5] shadow-warm-sm">
              <div className="text-xs text-[#817064] font-medium">Model Engine</div>
              <div className="text-sm font-mono font-bold text-[#382A25] mt-2 truncate">
                {forecast.model_version}
              </div>
              <div className="text-[11px] text-[#85845A] font-bold mt-1">
                Deterministic ET₀ depletion
              </div>
            </div>
          </div>

          {/* Day-by-Day Forecast Timeline Cards */}
          <div className="bg-[#FFFCF6] rounded-2xl border border-[#E8D6C5] shadow-warm-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E8D6C5] bg-[#FAF5ED] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <TrendingUp className="w-5 h-5 text-[#C96D3B]" />
                <h3 className="text-sm font-bold text-[#382A25] font-display">
                  Day-by-Day Projected Stress Trajectory & Uncertainty Envelope [p10, p90]
                </h3>
              </div>
              <span className="text-xs font-mono font-bold text-[#69483A] bg-[#FFFCF6] px-2.5 py-1 rounded-md border border-[#E8D6C5]">
                {forecast.field_name} ({forecast.field_id})
              </span>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {forecast.daily_projections.map((p) => (
                <div
                  key={p.day_offset}
                  className="bg-[#FAF5ED] rounded-2xl p-4 border border-[#E8D6C5] flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:border-[#D99A91]"
                >
                  {/* Date & Day Indicator */}
                  <div className="flex items-center gap-3 min-w-[140px]">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C96D3B] to-[#B95B55] text-[#FFFCF6] font-bold flex flex-col items-center justify-center text-xs shrink-0 shadow-warm-sm">
                      <span>D+{p.day_offset}</span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-[#382A25]">{p.date}</div>
                      <div className="mt-0.5">{getStatusBadge(p.projected_status)}</div>
                    </div>
                  </div>

                  {/* Risk Score & Uncertainty Interval Meter */}
                  <div className="flex-1 max-w-md">
                    <div className="flex justify-between items-center text-xs mb-1.5">
                      <span className="font-bold text-[#382A25]">
                        Projected Risk: <span className="font-extrabold font-mono text-[#B95B55]">{p.projected_risk_score.toFixed(1)}</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#817064]">
                        Envelope: [{p.confidence_p10.toFixed(1)} – {p.confidence_p90.toFixed(1)}]
                      </span>
                    </div>

                    {/* Visual Interval Bar */}
                    <div className="relative w-full bg-[#E8D6C5]/50 rounded-full h-3 overflow-hidden">
                      {/* Uncertainty Shading */}
                      <div
                        className="absolute h-3 bg-[#E5B94B]/35 rounded-full"
                        style={{
                          left: `${Math.max(0, p.confidence_p10)}%`,
                          width: `${Math.min(100, p.confidence_p90 - p.confidence_p10)}%`,
                        }}
                      ></div>
                      {/* Mean Point */}
                      <div
                        className={`h-3 rounded-full ${
                          p.projected_status === 'red'
                            ? 'bg-[#B95B55]'
                            : p.projected_status === 'amber'
                            ? 'bg-[#E5B94B]'
                            : p.projected_status === 'blue'
                            ? 'bg-[#4B729F]'
                            : 'bg-[#85845A]'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(4, p.projected_risk_score))}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Agronomic & Weather Signals */}
                  <div className="grid grid-cols-3 gap-3 text-xs min-w-[280px] bg-[#FFFCF6] p-2.5 rounded-xl border border-[#E8D6C5]">
                    <div>
                      <div className="text-[10px] text-[#817064] flex items-center gap-1">
                        <Droplets className="w-3 h-3 text-[#C96D3B]" />
                        <span>Soil Moisture</span>
                      </div>
                      <div className="font-bold text-[#382A25] mt-0.5 font-mono">
                        {(p.projected_soil_moisture * 100).toFixed(0)}%
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#817064] flex items-center gap-1">
                        <Sun className="w-3 h-3 text-[#E5B94B]" />
                        <span>Max Temp</span>
                      </div>
                      <div className="font-bold text-[#382A25] mt-0.5 font-mono">
                        {p.forecast_tmax}°C
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] text-[#817064] flex items-center gap-1">
                        <CloudRain className="w-3 h-3 text-[#4B729F]" />
                        <span>Rainfall</span>
                      </div>
                      <div className="font-bold text-[#382A25] mt-0.5 font-mono">
                        {p.forecast_rainfall} mm
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Influencing Signals List */}
          <div className="bg-[#FFFCF6] rounded-2xl p-4 sm:p-5 border border-[#E8D6C5] shadow-warm-sm">
            <div className="text-xs font-bold text-[#382A25] mb-2 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#C96D3B]" />
              <span>Influencing Model Inputs:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {forecast.influencing_inputs.map((inp, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-lg text-xs font-mono bg-[#FAF5ED] text-[#69483A] border border-[#E8D6C5]"
                >
                  {inp}
                </span>
              ))}
            </div>
          </div>

          {/* Heuristic Projection Disclaimer */}
          <div className="p-3.5 bg-[#FAF5ED] rounded-2xl text-[11px] text-[#817064] flex items-start gap-2.5 border border-[#E8D6C5]">
            <Info className="w-4 h-4 text-[#C96D3B] shrink-0 mt-0.5" />
            <span>{forecast.limitations_disclaimer}</span>
          </div>
        </>
      )}
    </div>
  );
};
