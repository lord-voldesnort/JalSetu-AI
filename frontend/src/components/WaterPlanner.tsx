import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { WaterPlanResponse } from '../types/api';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Info
} from 'lucide-react';

interface WaterPlannerProps {
  scenarioId: string;
}

export const WaterPlanner: React.FC<WaterPlannerProps> = ({ scenarioId }) => {
  const [budget, setBudget] = useState<number>(100);
  const [method, setMethod] = useState<string>('ai');
  const [plan, setPlan] = useState<WaterPlanResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlan = useCallback(async (budgetValue: number, meth: string, scenId: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.createWaterPlan(budgetValue, scenId, meth);
      setPlan(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate allocation plan';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan(budget, method, scenarioId);
  }, [scenarioId, fetchPlan]);

  const handleBudgetChange = (newBudget: number) => {
    setBudget(newBudget);
    fetchPlan(newBudget, method, scenarioId);
  };

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod);
    fetchPlan(budget, newMethod, scenarioId);
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
      {/* Budget Controls Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
              <h2 className="text-base font-bold text-slate-800">
                Cluster Water Allocation & Conservation Optimizer
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Guarantees mathematical budget conservation (Σ allocated ≤ budget). Allocates scarce irrigation by risk priority and crop water capacity.
            </p>
          </div>

          {/* Allocation Strategy Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => handleMethodChange('ai')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                method === 'ai'
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              JalSetu AI Prioritization
            </button>
            <button
              onClick={() => handleMethodChange('fixed_equal')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                method === 'fixed_equal'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Equal Allocation Share
            </button>
          </div>
        </div>

        {/* Budget Input Slider and Presets */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-teal-600" />
              <span>Available Cluster Water Budget (m³):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="500"
                step="5"
                value={budget}
                onChange={(e) => handleBudgetChange(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-28 text-sm font-bold text-teal-900 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-right focus:outline-none focus:ring-2 focus:ring-teal-500/20"
              />
              <span className="text-xs font-semibold text-slate-500">m³</span>
            </div>
          </div>

          {/* Range Slider */}
          <input
            type="range"
            min="0"
            max="300"
            step="5"
            value={budget}
            onChange={(e) => handleBudgetChange(parseFloat(e.target.value))}
            className="w-full accent-teal-600 cursor-pointer"
          />

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-semibold text-slate-400">Presets:</span>
            {[
              { val: 25, label: '25 m³ (Severe Drought)' },
              { val: 50, label: '50 m³ (Constrained)' },
              { val: 100, label: '100 m³ (Balanced)' },
              { val: 200, label: '200 m³ (Surplus)' },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => handleBudgetChange(p.val)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium border transition-colors ${
                  budget === p.val
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-16 border border-slate-200 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
          <span>Solving multi-objective water allocation subject to hard constraints...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-semibold">Planning computation error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {plan && !loading && (
        <>
          {/* Budget Conservation Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Requested Budget</div>
              <div className="text-2xl font-extrabold text-slate-800 mt-1">
                {plan.requested_budget_m3.toFixed(1)} <span className="text-xs font-semibold text-slate-400">m³</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Available cluster quota</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Total Allocated</div>
              <div className="text-2xl font-extrabold text-teal-700 mt-1">
                {plan.total_allocated_m3.toFixed(1)} <span className="text-xs font-semibold text-slate-400">m³</span>
              </div>
              <div className="text-[11px] text-teal-600 font-semibold mt-1">
                {plan.budget_utilization_pct.toFixed(1)}% Utilized
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Unallocated Remainder</div>
              <div className="text-2xl font-extrabold text-slate-700 mt-1">
                {plan.unallocated_remainder_m3.toFixed(1)} <span className="text-xs font-semibold text-slate-400">m³</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Conserved reservoir margin</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs text-slate-500 font-medium">Constraint Verification</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Budget Conserved: {plan.constraint_checks?.budget_conserved ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Capacities Respected: {plan.constraint_checks?.capacities_respected ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Paused Fields Excluded: {plan.constraint_checks?.paused_fields_zero_allocation ? 'PASS' : 'FAIL'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Baseline Comparison Card */}
          <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="w-5 h-5 text-teal-400" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-teal-200">
                Agronomic Decision Advantage: AI Prioritization vs Equal Allocation
              </h3>
            </div>

            <p className="text-xs text-teal-100/90 leading-relaxed mb-4">
              {plan.baseline_comparison.narrative}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-xs">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <div className="text-teal-200/80 font-medium">High/Crit Risk Allocation Share</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-300">
                    {plan.baseline_comparison.ai_high_risk_share_pct.toFixed(0)}%
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    vs {plan.baseline_comparison.baseline_high_risk_share_pct.toFixed(0)}% Baseline
                  </span>
                </div>
                <div className="text-[11px] text-teal-100/70 mt-1">
                  Targeted at vulnerable crops
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <div className="text-teal-200/80 font-medium">Water Volume to High-Risk Fields</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-300">
                    {plan.baseline_comparison.ai_high_risk_allocation_m3.toFixed(1)} m³
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    vs {plan.baseline_comparison.baseline_high_risk_allocation_m3.toFixed(1)} m³
                  </span>
                </div>
                <div className="text-[11px] text-teal-100/70 mt-1">
                  Prevents catastrophic yield loss
                </div>
              </div>

              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <div className="text-teal-200/80 font-medium">Top-Stressed Fields Funded</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-emerald-300">
                    {plan.baseline_comparison.top_stressed_fields_funded_ai}
                  </span>
                  <span className="text-slate-400 text-xs font-mono">
                    vs {plan.baseline_comparison.top_stressed_fields_funded_baseline} Baseline
                  </span>
                </div>
                <div className="text-[11px] text-teal-100/70 mt-1">
                  Fields receiving required irrigation
                </div>
              </div>
            </div>
          </div>

          {/* Ranked Allocation Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800">
                  Priority-Ranked Field Allocation Roster
                </h3>
                <p className="text-xs text-slate-500">
                  Fields sorted in decreasing order of stress priority and water deficit.
                </p>
              </div>
              <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-slate-200 text-slate-800">
                10 Fields Monitored
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Field ID</th>
                    <th className="p-3">Risk Level</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Demand (m³)</th>
                    <th className="p-3">Allocated (m³)</th>
                    <th className="p-3">Capacity (m³)</th>
                    <th className="p-3">Fulfillment</th>
                    <th className="p-3">Agronomic Allocation Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {plan.allocations.map((alloc) => (
                    <tr key={alloc.field_id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-teal-700">
                        #{alloc.priority_rank}
                      </td>
                      <td className="p-3 font-medium">
                        <span className="font-mono font-bold text-slate-800">{alloc.field_id}</span>
                        <div className="text-[11px] text-slate-500">{alloc.field_name}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            alloc.risk_level === 'Critical' || alloc.risk_level === 'High'
                              ? 'bg-red-100 text-red-800'
                              : alloc.risk_level === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {alloc.risk_level} ({alloc.risk_score.toFixed(1)})
                        </span>
                      </td>
                      <td className="p-3">{getStatusBadge(alloc.stress_status)}</td>
                      <td className="p-3 font-mono">{alloc.requested_demand_m3.toFixed(1)}</td>
                      <td className="p-3 font-mono font-bold text-teal-800">
                        {alloc.allocated_volume_m3.toFixed(1)}
                      </td>
                      <td className="p-3 font-mono text-slate-500">{alloc.capacity_limit_m3.toFixed(1)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-16 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-teal-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, alloc.allocation_percentage)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[11px] font-bold">
                            {alloc.allocation_percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 max-w-xs">{alloc.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Planning Aid Disclaimer */}
          <div className="p-3.5 bg-slate-100 rounded-xl text-[11px] text-slate-500 flex items-start gap-2">
            <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
            <span>{plan.disclaimer}</span>
          </div>
        </>
      )}
    </div>
  );
};
