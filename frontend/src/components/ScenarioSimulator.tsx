import React, { useState } from 'react';
import { api } from '../api/client';
import { ScenarioReplayResponse } from '../types/api';
import {
  Sun,
  CloudRain,
  Activity,
  RotateCcw,
  Play,
  ArrowRight,
  AlertTriangle,
  Info,
  Layers
} from 'lucide-react';

interface ScenarioSimulatorProps {
  activeScenarioId: string;
  onScenarioChanged: (newScenarioId: string) => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  activeScenarioId,
  onScenarioChanged,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [replayResult, setReplayResult] = useState<ScenarioReplayResponse | null>(null);

  const scenariosList = [
    {
      id: 'normal_01',
      title: 'Normal Seasonal Baseline',
      type: 'baseline',
      description: 'Standard Pune peri-urban seasonal weather. Stable daytime temperatures (32°C), expected 2.0mm rainfall, nominal evapotranspiration.',
      icon: Sun,
      color: 'olive',
      badge: 'Baseline Operational State',
    },
    {
      id: 'rainfall_deficit_heat_01',
      title: 'Rainfall Deficit + Heatwave Shock',
      type: 'drought_heat',
      description: 'Extreme heat spike to 36.5°C (+4.5°C above seasonal) coupled with an 85% rainfall deficit (0.3mm). Accelerates soil drying and escalates crop water stress rapidly.',
      icon: Activity,
      color: 'tomato',
      badge: 'Acute Stress Escalation',
    },
    {
      id: 'heavy_rain_pause_01',
      title: 'Heavy Rainfall & Waterlogging Alert',
      type: 'extreme_precipitation',
      description: 'Extreme rainfall deluge delivering 65.0mm (+60mm). Triggers protect_pause emergency rule to avoid root hypoxia, nutrient runoff, and wasteful energy use.',
      icon: CloudRain,
      color: 'blue',
      badge: 'Emergency Pause Trigger',
    },
  ];

  const handleReplay = async (scenId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.replayScenario(scenId);
      setReplayResult(res);
      onScenarioChanged(res.scenario_id);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to simulate scenario';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.resetScenario();
      setReplayResult(res);
      onScenarioChanged('normal_01');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to reset scenario';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'red':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#B95B55]/15 text-[#8A3C37] border border-[#B95B55]/30">Red</span>;
      case 'amber':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E5B94B]/20 text-[#69483A] border border-[#E5B94B]/40">Amber</span>;
      case 'blue':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">Blue</span>;
      case 'green':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#85845A]/15 text-[#585736] border border-[#85845A]/30">Green</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Hero Banner with Agricultural Photo */}
      <div className="relative rounded-2xl overflow-hidden shadow-warm-md border border-[#E8D6C5]">
        <img
          src="/images/hero-climate.jpg"
          alt="Farmland under dynamic weather changes"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="relative bg-gradient-to-r from-[#382A25]/95 via-[#382A25]/85 to-[#69483A]/70 p-6 sm:p-8 text-[#FFFCF6]">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#B95B55]/30 text-[#E8D6C5] backdrop-blur-xs border border-[#B95B55]/40">
              <Activity className="w-3.5 h-3.5 text-[#E5B94B]" /> Dynamic Climate Stress Simulation
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#FFFCF6]">
              Climate Shock Simulator & Sensitivity Analysis
            </h1>
            <p className="text-xs sm:text-sm text-[#E8D6C5]/90 leading-relaxed">
              Evaluate field cluster resilience under heatwave deficits and cloudburst waterlogging shocks without mutating the underlying historical baseline observations.
            </p>
          </div>
        </div>
      </div>

      {/* Header and Reset Action */}
      <div className="bg-[#FFFCF6] rounded-2xl p-5 border border-[#E8D6C5] shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C96D3B]"></span>
            <h2 className="text-base font-bold text-[#382A25] font-display">
              Selectable Climate Scenarios
            </h2>
          </div>
          <p className="text-xs text-[#817064] mt-1">
            Simulate weather shocks to stress-test your irrigation policies before drought or flood conditions strike.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={loading || activeScenarioId === 'normal_01'}
          className="font-inter font-semibold text-[14px] px-4 py-2.5 bg-[#FFFCF6] hover:bg-[#FAF5ED] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[#69483A] hover:text-[#382A25] rounded-xl transition-all duration-150 inline-flex items-center justify-center gap-2 border border-[#E8D6C5] hover:border-[#D99A91] shadow-warm-sm focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
        >
          <RotateCcw className="w-4 h-4 text-[#C96D3B]" />
          <span>Reset to Normal Baseline</span>
        </button>
      </div>

      {/* Scenario Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {scenariosList.map((scen) => {
          const isActive = activeScenarioId === scen.id;
          const Icon = scen.icon;

          return (
            <div
              key={scen.id}
              className={`bg-[#FFFCF6] rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md ${
                isActive
                  ? 'border-[#C96D3B] ring-2 ring-[#C96D3B]/20 bg-[#F2E1D4]/15'
                  : 'border-[#E8D6C5] hover:border-[#D99A91]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-warm-sm ${
                      scen.color === 'tomato'
                        ? 'bg-[#B95B55]/15 text-[#B95B55]'
                        : scen.color === 'blue'
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-[#85845A]/15 text-[#85845A]'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-[#C96D3B] text-[#FFFCF6] shadow-warm-sm'
                        : 'bg-[#FAF5ED] text-[#817064] border border-[#E8D6C5]'
                    }`}
                  >
                    {isActive ? 'Active Mode' : scen.badge}
                  </span>
                </div>

                <h3 className="font-bold text-[#382A25] text-sm mb-1.5 font-display">
                  {scen.title}
                </h3>
                <p className="text-xs text-[#69483A] leading-relaxed mb-4">
                  {scen.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleReplay(scen.id)}
                disabled={loading}
                className={`font-inter font-semibold text-[14px] w-full py-2.5 px-4 rounded-xl transition-all duration-150 inline-flex items-center justify-center gap-2 shadow-warm-sm active:scale-[0.98] focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed border border-transparent ${
                  isActive
                    ? 'bg-[#B95B55] hover:bg-[#A34E48] text-[#FFFCF6] focus:ring-[#B95B55]/40'
                    : 'bg-[#C96D3B] hover:bg-[#B35E30] text-[#FFFCF6] focus:ring-[#C96D3B]/40'
                }`}
              >
                {loading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>{isActive ? 'Re-simulate Scenario' : 'Simulate Shock'}</span>
              </button>
            </div>
          );
        })}
      </div>

      {error && (
        <div className="bg-[#B95B55]/10 border border-[#B95B55]/30 rounded-2xl p-4 text-xs text-[#8A3C37] flex items-start gap-2.5 shadow-warm-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B95B55]" />
          <div>
            <p className="font-bold">Scenario Replay Failed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Replay Results & Diffs View */}
      {replayResult && (
        <div className="bg-[#FFFCF6] rounded-2xl border border-[#E8D6C5] shadow-warm-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-[#E8D6C5] bg-[#FAF5ED] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Layers className="w-5 h-5 text-[#C96D3B]" />
              <div>
                <h3 className="text-sm font-bold text-[#382A25] font-display">
                  Simulation Impact Analysis: {replayResult.title}
                </h3>
                <p className="text-xs text-[#817064]">
                  {replayResult.fields_affected_count} fields directly impacted across the cluster
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-md bg-[#FAF5ED] text-[#69483A] border border-[#E8D6C5]">
              Synthetic In-Memory Replay
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Engine Summary Narrative */}
            <div className="bg-[#F2E1D4]/40 border border-[#E8D6C5] rounded-2xl p-4 text-xs text-[#382A25] flex items-start gap-3 shadow-warm-sm">
              <Info className="w-5 h-5 text-[#C96D3B] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-[#382A25] mb-1 font-display">Agronomic Impact Narrative:</p>
                <p className="leading-relaxed text-[#69483A]">{replayResult.summary_narrative}</p>
              </div>
            </div>

            {/* Changed Input Signals Table */}
            {replayResult.signals_changed && replayResult.signals_changed.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-[#382A25] uppercase tracking-wider mb-2 font-display">
                  Perturbed Environmental Signals
                </h4>
                <div className="overflow-x-auto rounded-xl border border-[#E8D6C5] bg-[#FFFCF6]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF5ED] text-[#382A25] font-bold border-b border-[#E8D6C5]">
                      <tr>
                        <th className="p-3">Variable</th>
                        <th className="p-3">Baseline</th>
                        <th className="p-3">Simulated</th>
                        <th className="p-3">Delta</th>
                        <th className="p-3">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8D6C5]/60 text-[#69483A]">
                      {replayResult.signals_changed.map((sig, idx) => (
                        <tr key={idx} className="bg-[#FFFCF6]">
                          <td className="p-3 font-mono font-bold text-[#382A25]">{sig.variable}</td>
                          <td className="p-3">{sig.baseline_value} {sig.unit}</td>
                          <td className="p-3 font-bold text-[#C96D3B]">{sig.simulated_value} {sig.unit}</td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-0.5 rounded font-mono font-bold text-[11px] ${
                                sig.difference > 0
                                  ? 'bg-[#B95B55]/15 text-[#8A3C37]'
                                  : 'bg-blue-100 text-blue-900'
                              }`}
                            >
                              {sig.difference > 0 ? '+' : ''}{sig.difference} {sig.unit}
                            </span>
                          </td>
                          <td className="p-3 text-[#817064]">{sig.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Field Status Transitions Table */}
            <div>
              <h4 className="text-xs font-bold text-[#382A25] uppercase tracking-wider mb-2 font-display">
                Field-by-Field Status & Action Transitions
              </h4>
              <div className="overflow-x-auto rounded-xl border border-[#E8D6C5] bg-[#FFFCF6]">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF5ED] text-[#382A25] font-bold border-b border-[#E8D6C5]">
                    <tr>
                      <th className="p-3">Field</th>
                      <th className="p-3">Risk Score Shift</th>
                      <th className="p-3">Status Transition</th>
                      <th className="p-3">Action Transition</th>
                      <th className="p-3">Change Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8D6C5]/60 text-[#69483A]">
                    {replayResult.field_status_diffs.map((diff) => (
                      <tr key={diff.field_id} className={diff.changed ? 'bg-[#F2E1D4]/30' : 'bg-[#FFFCF6]'}>
                        <td className="p-3 font-medium">
                          <span className="font-mono font-bold text-[#382A25]">{diff.field_id}</span>
                          <span className="text-[#817064] ml-1">({diff.field_name})</span>
                        </td>
                        <td className="p-3 font-mono">
                          <span>{diff.baseline_score.toFixed(1)}</span>
                          <span className="mx-1.5 text-[#9D8D82]">→</span>
                          <span className={`font-bold ${diff.simulated_score > diff.baseline_score ? 'text-[#B95B55]' : 'text-[#382A25]'}`}>
                            {diff.simulated_score.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(diff.baseline_status)}
                            <ArrowRight className="w-3 h-3 text-[#9D8D82]" />
                            {getStatusBadge(diff.simulated_status)}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-[#817064]">{diff.baseline_action}</span>
                            <ArrowRight className="w-3 h-3 text-[#9D8D82]" />
                            <span className="font-bold text-[#C96D3B]">{diff.simulated_action}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          {diff.changed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#E5B94B]/20 text-[#69483A] border border-[#E5B94B]/40">
                              SHIFTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] text-[#9D8D82]">
                              UNCHANGED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
