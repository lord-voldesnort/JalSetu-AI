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
      color: 'teal',
      badge: 'Baseline Operational State',
    },
    {
      id: 'rainfall_deficit_heat_01',
      title: 'Rainfall Deficit + Heatwave Shock',
      type: 'drought_heat',
      description: 'Extreme heat spike to 36.5°C (+4.5°C above seasonal) coupled with an 85% rainfall deficit (0.3mm). Accelerates soil drying and escalates crop water stress rapidly.',
      icon: Activity,
      color: 'amber',
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
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Red</span>;
      case 'amber':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Amber</span>;
      case 'blue':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Blue</span>;
      case 'green':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Green</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Reset Action */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <h2 className="text-base font-bold text-slate-800">
              Climate Shock Simulator & Scenario Replay
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Test policy resilience by perturbing environmental variables (temperature, rainfall, soil drying) without mutating database records.
          </p>
        </div>

        <button
          onClick={handleReset}
          disabled={loading || activeScenarioId === 'normal_01'}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-slate-300"
        >
          <RotateCcw className="w-3.5 h-3.5" />
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
              className={`bg-white rounded-2xl p-5 border transition-all flex flex-col justify-between shadow-xs ${
                isActive
                  ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      scen.color === 'amber'
                        ? 'bg-amber-100 text-amber-800'
                        : scen.color === 'blue'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-teal-100 text-teal-800'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isActive
                        ? 'bg-teal-600 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isActive ? 'Active Mode' : scen.badge}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm mb-1.5">
                  {scen.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {scen.description}
                </p>
              </div>

              {/* Action Button */}
              <button
                onClick={() => handleReplay(scen.id)}
                disabled={loading}
                className={`w-full py-2.5 px-3 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-xs ${
                  isActive
                    ? 'bg-slate-800 text-white hover:bg-slate-900'
                    : 'bg-teal-600 text-white hover:bg-teal-700'
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
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-semibold">Scenario Replay Failed</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Replay Results & Diffs View */}
      {replayResult && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-teal-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Simulation Impact Analysis: {replayResult.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {replayResult.fields_affected_count} fields directly impacted across the cluster
                </p>
              </div>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-teal-100 text-teal-800">
              Synthetic In-Memory Replay
            </span>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Engine Summary Narrative */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-4 text-xs text-teal-900 flex items-start gap-3">
              <Info className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-teal-950 mb-1">Agronomic Impact Narrative:</p>
                <p className="leading-relaxed">{replayResult.summary_narrative}</p>
              </div>
            </div>

            {/* Changed Input Signals Table */}
            {replayResult.signals_changed && replayResult.signals_changed.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Perturbed Environmental Signals
                </h4>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Variable</th>
                        <th className="p-2.5">Baseline</th>
                        <th className="p-2.5">Simulated</th>
                        <th className="p-2.5">Delta</th>
                        <th className="p-2.5">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {replayResult.signals_changed.map((sig, idx) => (
                        <tr key={idx} className="bg-white">
                          <td className="p-2.5 font-mono font-semibold text-slate-800">{sig.variable}</td>
                          <td className="p-2.5">{sig.baseline_value} {sig.unit}</td>
                          <td className="p-2.5 font-bold text-teal-700">{sig.simulated_value} {sig.unit}</td>
                          <td className="p-2.5">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono font-semibold text-[11px] ${
                                sig.difference > 0
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {sig.difference > 0 ? '+' : ''}{sig.difference} {sig.unit}
                            </span>
                          </td>
                          <td className="p-2.5 text-slate-600">{sig.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Field Status Transitions Table */}
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Field-by-Field Status & Action Transitions
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Field</th>
                      <th className="p-2.5">Risk Score Shift</th>
                      <th className="p-2.5">Status Transition</th>
                      <th className="p-2.5">Action Transition</th>
                      <th className="p-2.5">Change Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {replayResult.field_status_diffs.map((diff) => (
                      <tr key={diff.field_id} className={diff.changed ? 'bg-amber-50/30' : 'bg-white'}>
                        <td className="p-2.5 font-medium">
                          <span className="font-mono font-bold text-slate-800">{diff.field_id}</span>
                          <span className="text-slate-500 ml-1">({diff.field_name})</span>
                        </td>
                        <td className="p-2.5 font-mono">
                          <span>{diff.baseline_score.toFixed(1)}</span>
                          <span className="mx-1.5 text-slate-400">→</span>
                          <span className={`font-bold ${diff.simulated_score > diff.baseline_score ? 'text-red-600' : 'text-slate-800'}`}>
                            {diff.simulated_score.toFixed(1)}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5">
                            {getStatusBadge(diff.baseline_status)}
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            {getStatusBadge(diff.simulated_status)}
                          </div>
                        </td>
                        <td className="p-2.5">
                          <div className="flex items-center gap-1.5 font-mono text-[11px]">
                            <span className="text-slate-600">{diff.baseline_action}</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                            <span className="font-bold text-teal-800">{diff.simulated_action}</span>
                          </div>
                        </td>
                        <td className="p-2.5">
                          {diff.changed ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                              SHIFTED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] text-slate-400">
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
