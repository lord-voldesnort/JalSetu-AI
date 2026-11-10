import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import { WaterPlanResponse } from '../types/api';
import {
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Info,
  Droplets
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
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D32F2F]/15 text-[#D32F2F] border border-[#D32F2F]/30">Red</span>;
      case 'amber':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/30">Amber</span>;
      case 'blue':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#299BCB]/15 text-[#123B66] border border-[#299BCB]/30">Blue</span>;
      case 'green':
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#438653]/15 text-[#245C38] border border-[#438653]/30">Green</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Hero Banner with Agricultural Photo */}
      <div className="relative rounded-2xl overflow-hidden shadow-ocean-md border border-[#CBD5E1]">
        <img
          src="/images/hero-irrigation.jpg"
          alt="Canal irrigation and crop rows"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="relative bg-gradient-to-r from-[#123B66]/95 via-[#123B66]/85 to-[#299BCB]/75 p-6 sm:p-8 text-white">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#299BCB]/30 text-[#E8F2E5] backdrop-blur-xs border border-[#76C4E5]/40">
              <Droplets className="w-3.5 h-3.5 text-[#76C4E5]" /> Constrained Agricultural Optimization
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Cluster Water Allocation & Conservation Optimizer
            </h1>
            <p className="text-xs sm:text-sm text-[#F5F8FC]/90 leading-relaxed">
              Conserves scarce reservoir water with mathematical rigor (Σ allocated ≤ budget) while prioritizing vulnerable crops based on growth stage, risk severity, and soil limits.
            </p>
          </div>
        </div>
      </div>

      {/* Budget Controls Card */}
      <div className="bg-white rounded-2xl p-5 border border-[#CBD5E1] shadow-ocean-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#299BCB]"></span>
              <h2 className="text-base font-bold text-[#123B66] font-display">
                Water Budget & Strategy Configuration
              </h2>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Select allocation methodology and adjust available cluster volume in cubic metres ($m^3$).
            </p>
          </div>

          {/* Allocation Strategy Toggle */}
          <div className="flex items-center gap-1.5 bg-[#F5F8FC] p-1 rounded-xl border border-[#CBD5E1]">
            <button
              onClick={() => handleMethodChange('ai')}
              className={`font-inter font-semibold text-[14px] px-4 py-2 rounded-xl transition-all duration-150 inline-flex items-center justify-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 shadow-ocean-sm ${
                method === 'ai'
                  ? 'bg-[#299BCB] hover:bg-[#2184AD] text-white border border-transparent'
                  : 'bg-white hover:bg-[#F8FAFC] text-[#123B66] border border-[#CBD5E1] hover:border-[#299BCB]'
              }`}
            >
              JalSetu AI Prioritization
            </button>
            <button
              onClick={() => handleMethodChange('fixed_equal')}
              className={`font-inter font-semibold text-[14px] px-4 py-2 rounded-xl transition-all duration-150 inline-flex items-center justify-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#123B66]/40 shadow-ocean-sm ${
                method === 'fixed_equal'
                  ? 'bg-[#123B66] hover:bg-[#0D2A4A] text-white border border-transparent'
                  : 'bg-white hover:bg-[#F8FAFC] text-[#123B66] border border-[#CBD5E1] hover:border-[#299BCB]'
              }`}
            >
              Equal Allocation Share
            </button>
          </div>
        </div>

        {/* Budget Input Slider and Presets */}
        <div className="bg-[#F5F8FC] p-4 rounded-xl border border-[#CBD5E1] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <label className="text-xs font-bold text-[#123B66] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#299BCB]" />
              <span>Available Cluster Water Budget:</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="500"
                step="5"
                value={budget}
                onChange={(e) => handleBudgetChange(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-28 text-sm font-extrabold text-[#299BCB] bg-white border border-[#CBD5E1] rounded-xl px-3 py-1.5 text-right font-mono focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
              />
              <span className="text-xs font-bold text-[#64748B]">m³</span>
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
            className="w-full accent-[#299BCB] cursor-pointer"
          />

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-[#64748B]">Presets:</span>
            {[
              { val: 25, label: '25 m³ (Severe Drought)' },
              { val: 50, label: '50 m³ (Constrained)' },
              { val: 100, label: '100 m³ (Balanced)' },
              { val: 200, label: '200 m³ (Surplus)' },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => handleBudgetChange(p.val)}
                className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3.5 py-1.5 rounded-xl border transition-all duration-150 inline-flex items-center justify-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 shadow-ocean-sm ${
                  budget === p.val
                    ? 'bg-[#299BCB] hover:bg-[#2184AD] text-white border-transparent'
                    : 'bg-white hover:bg-[#F8FAFC] text-[#123B66] border-[#CBD5E1] hover:border-[#299BCB]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl p-16 border border-[#CBD5E1] text-center text-[#64748B] text-xs flex flex-col items-center justify-center gap-3 shadow-ocean-sm">
          <div className="w-8 h-8 border-3 border-[#299BCB] border-t-transparent rounded-full animate-spin"></div>
          <span>Solving multi-objective water allocation subject to hard constraints...</span>
        </div>
      )}

      {error && (
        <div className="bg-[#D32F2F]/10 border border-[#D32F2F]/30 rounded-2xl p-4 text-xs text-[#D32F2F] flex items-start gap-2.5 shadow-ocean-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D32F2F]" />
          <div>
            <p className="font-bold">Planning computation error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {plan && !loading && (
        <>
          {/* Budget Conservation Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD5E1] shadow-ocean-sm">
              <div className="text-xs text-[#64748B] font-medium">Requested Budget</div>
              <div className="text-2xl font-extrabold text-[#0F172A] font-display mt-1">
                {plan.requested_budget_m3.toFixed(1)} <span className="text-xs font-semibold text-[#64748B]">m³</span>
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-1">Available cluster quota</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD5E1] shadow-ocean-sm">
              <div className="text-xs text-[#64748B] font-medium">Total Allocated</div>
              <div className="text-2xl font-extrabold text-[#299BCB] font-display mt-1">
                {plan.total_allocated_m3.toFixed(1)} <span className="text-xs font-semibold text-[#64748B]">m³</span>
              </div>
              {/* Blue Percentage Bar for Budget Utilization */}
              <div className="w-full bg-[#DCEFF8] rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-[#1976B9] h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, plan.budget_utilization_pct))}%` }}
                />
              </div>
              <div className="text-[11px] text-[#1976B9] font-bold mt-1">
                {plan.budget_utilization_pct.toFixed(1)}% Utilized
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD5E1] shadow-ocean-sm">
              <div className="text-xs text-[#64748B] font-medium">Unallocated Remainder</div>
              <div className="text-2xl font-extrabold text-[#123B66] font-display mt-1">
                {plan.unallocated_remainder_m3.toFixed(1)} <span className="text-xs font-semibold text-[#64748B]">m³</span>
              </div>
              <div className="text-[11px] text-[#94A3B8] mt-1">Conserved reservoir margin</div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD5E1] shadow-ocean-sm">
              <div className="text-xs text-[#64748B] font-medium">Constraint Verification</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-[#245C38] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#438653]" />
                  <span>Budget: {plan.constraint_checks?.budget_conserved ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#245C38] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#438653]" />
                  <span>Capacities: {plan.constraint_checks?.capacities_respected ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#245C38] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#438653]" />
                  <span>Pause Safe: {plan.constraint_checks?.paused_fields_zero_allocation ? 'PASS' : 'FAIL'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Baseline Comparison Card in Ocean Blue */}
          <div className="bg-[#123B66] rounded-2xl p-6 text-white shadow-ocean-md border border-[#0D2A4A]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Scale className="w-5 h-5 text-[#76C4E5]" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-[#76C4E5] font-display">
                Agronomic Decision Advantage: AI Prioritization vs Equal Allocation
              </h3>
            </div>

            <p className="text-xs text-[#F5F8FC] leading-relaxed mb-4">
              {plan.baseline_comparison.narrative}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#1A4B7D] text-xs">
              <div className="bg-[#0D2A4A] rounded-xl p-3.5 border border-[#1A4B7D]">
                <div className="text-[#F5F8FC] font-medium">High/Crit Risk Allocation Share</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#76C4E5] font-display">
                    {plan.baseline_comparison.ai_high_risk_share_pct.toFixed(0)}%
                  </span>
                  <span className="text-[#94A3B8] text-xs font-mono">
                    vs {plan.baseline_comparison.baseline_high_risk_share_pct.toFixed(0)}% Baseline
                  </span>
                </div>
                <div className="text-[11px] text-[#E8F2E5]/70 mt-1">
                  Targeted at vulnerable crops
                </div>
              </div>

              <div className="bg-[#0D2A4A] rounded-xl p-3.5 border border-[#1A4B7D]">
                <div className="text-[#F5F8FC] font-medium">Water Volume to High-Risk Fields</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#76C4E5] font-display">
                    {plan.baseline_comparison.ai_high_risk_allocation_m3.toFixed(1)} m³
                  </span>
                  <span className="text-[#94A3B8] text-xs font-mono">
                    vs {plan.baseline_comparison.baseline_high_risk_allocation_m3.toFixed(1)} m³
                  </span>
                </div>
                <div className="text-[11px] text-[#E8F2E5]/70 mt-1">
                  Prevents catastrophic yield loss
                </div>
              </div>

              <div className="bg-[#0D2A4A] rounded-xl p-3.5 border border-[#1A4B7D]">
                <div className="text-[#F5F8FC] font-medium">Top-Stressed Fields Funded</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#76C4E5] font-display">
                    {plan.baseline_comparison.top_stressed_fields_funded_ai}
                  </span>
                  <span className="text-[#94A3B8] text-xs font-mono">
                    vs {plan.baseline_comparison.top_stressed_fields_funded_baseline} Baseline
                  </span>
                </div>
                <div className="text-[11px] text-[#E8F2E5]/70 mt-1">
                  Fields receiving required irrigation
                </div>
              </div>
            </div>
          </div>

          {/* Ranked Allocation Table */}
          <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-ocean-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#CBD5E1] bg-[#F5F8FC] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#123B66] font-display">
                  Priority-Ranked Field Allocation Roster
                </h3>
                <p className="text-xs text-[#64748B]">
                  Fields sorted in decreasing order of stress priority and physiological water deficit.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-white text-[#123B66] border border-[#CBD5E1]">
                10 Fields Monitored
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F5F8FC] text-[#123B66] font-bold border-b border-[#CBD5E1]">
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
                <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                  {plan.allocations.map((alloc) => (
                    <tr key={alloc.field_id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#299BCB]">
                        #{alloc.priority_rank}
                      </td>
                      <td className="p-3 font-medium">
                        <span className="font-mono font-bold text-[#123B66]">{alloc.field_id}</span>
                        <div className="text-[11px] text-[#64748B]">{alloc.field_name}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            alloc.risk_level === 'Critical' || alloc.risk_level === 'High'
                              ? 'bg-[#D32F2F]/15 text-[#D32F2F]'
                              : alloc.risk_level === 'Moderate'
                              ? 'bg-[#D97706]/15 text-[#D97706]'
                              : 'bg-[#438653]/15 text-[#245C38]'
                          }`}
                        >
                          {alloc.risk_level} ({alloc.risk_score.toFixed(1)})
                        </span>
                      </td>
                      <td className="p-3">{getStatusBadge(alloc.stress_status)}</td>
                      <td className="p-3 font-mono">{alloc.requested_demand_m3.toFixed(1)}</td>
                      <td className="p-3 font-mono font-bold text-[#299BCB]">
                        {alloc.allocated_volume_m3.toFixed(1)}
                      </td>
                      <td className="p-3 font-mono text-[#64748B]">{alloc.capacity_limit_m3.toFixed(1)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {/* Percentage Bar in Shades of Blue with Pale Blue Track */}
                          <div className="w-16 bg-[#DCEFF8] rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#299BCB] h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(0, alloc.allocation_percentage))}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#123B66]">
                            {alloc.allocation_percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-[#475569] max-w-xs">{alloc.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Planning Aid Disclaimer */}
          <div className="p-4 bg-[#F5F8FC] rounded-2xl text-[11px] text-[#64748B] flex items-start gap-2.5 border border-[#CBD5E1]">
            <Info className="w-4 h-4 text-[#299BCB] shrink-0 mt-0.5" />
            <span>{plan.disclaimer}</span>
          </div>
        </>
      )}
    </div>
  );
};
