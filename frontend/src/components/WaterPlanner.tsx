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
          src="/images/hero-irrigation.jpg"
          alt="Canal irrigation and crop rows"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="relative bg-gradient-to-r from-[#382A25]/95 via-[#382A25]/85 to-[#69483A]/70 p-6 sm:p-8 text-[#FFFCF6]">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C96D3B]/30 text-[#E8D6C5] backdrop-blur-xs border border-[#C96D3B]/40">
              <Droplets className="w-3.5 h-3.5 text-[#E5B94B]" /> Constrained Agricultural Optimization
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#FFFCF6]">
              Cluster Water Allocation & Conservation Optimizer
            </h1>
            <p className="text-xs sm:text-sm text-[#E8D6C5]/90 leading-relaxed">
              Conserves scarce reservoir water with mathematical rigor (Σ allocated ≤ budget) while prioritizing vulnerable crops based on growth stage, risk severity, and soil limits.
            </p>
          </div>
        </div>
      </div>

      {/* Budget Controls Card */}
      <div className="bg-[#FFFCF6] rounded-2xl p-5 border border-[#E8D6C5] shadow-warm-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C96D3B]"></span>
              <h2 className="text-base font-bold text-[#382A25] font-display">
                Water Budget & Strategy Configuration
              </h2>
            </div>
            <p className="text-xs text-[#817064] mt-1">
              Select allocation methodology and adjust available cluster volume in cubic metres ($m^3$).
            </p>
          </div>

          {/* Allocation Strategy Toggle */}
          <div className="flex items-center gap-1.5 bg-[#FAF5ED] p-1 rounded-xl border border-[#E8D6C5]">
            <button
              onClick={() => handleMethodChange('ai')}
              className={`font-inter font-semibold text-[14px] px-4 py-2 rounded-xl transition-all duration-150 inline-flex items-center justify-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40 shadow-warm-sm ${
                method === 'ai'
                  ? 'bg-[#C96D3B] hover:bg-[#B35E30] text-[#FFFCF6] border border-transparent'
                  : 'bg-[#FFFCF6] hover:bg-[#FAF5ED] text-[#69483A] hover:text-[#382A25] border border-[#E8D6C5] hover:border-[#D99A91]'
              }`}
            >
              JalSetu AI Prioritization
            </button>
            <button
              onClick={() => handleMethodChange('fixed_equal')}
              className={`font-inter font-semibold text-[14px] px-4 py-2 rounded-xl transition-all duration-150 inline-flex items-center justify-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B95B55]/40 shadow-warm-sm ${
                method === 'fixed_equal'
                  ? 'bg-[#B95B55] hover:bg-[#A34E48] text-[#FFFCF6] border border-transparent'
                  : 'bg-[#FFFCF6] hover:bg-[#FAF5ED] text-[#69483A] hover:text-[#382A25] border border-[#E8D6C5] hover:border-[#D99A91]'
              }`}
            >
              Equal Allocation Share
            </button>
          </div>
        </div>

        {/* Budget Input Slider and Presets */}
        <div className="bg-[#FAF5ED] p-4 rounded-xl border border-[#E8D6C5] space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <label className="text-xs font-bold text-[#382A25] flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#C96D3B]" />
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
                className="w-28 text-sm font-extrabold text-[#C96D3B] bg-[#FFFCF6] border border-[#E8D6C5] rounded-xl px-3 py-1.5 text-right font-mono focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
              />
              <span className="text-xs font-bold text-[#69483A]">m³</span>
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
            className="w-full accent-[#C96D3B] cursor-pointer"
          />

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-[11px] font-bold text-[#817064]">Presets:</span>
            {[
              { val: 25, label: '25 m³ (Severe Drought)' },
              { val: 50, label: '50 m³ (Constrained)' },
              { val: 100, label: '100 m³ (Balanced)' },
              { val: 200, label: '200 m³ (Surplus)' },
            ].map((p) => (
              <button
                key={p.val}
                onClick={() => handleBudgetChange(p.val)}
                className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3.5 py-1.5 rounded-xl border transition-all duration-150 inline-flex items-center justify-center active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40 shadow-warm-sm ${
                  budget === p.val
                    ? 'bg-[#C96D3B] hover:bg-[#B35E30] text-[#FFFCF6] border-transparent'
                    : 'bg-[#FFFCF6] hover:bg-[#FAF5ED] text-[#69483A] hover:text-[#382A25] border-[#E8D6C5] hover:border-[#D99A91]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="bg-[#FFFCF6] rounded-2xl p-16 border border-[#E8D6C5] text-center text-[#817064] text-xs flex flex-col items-center justify-center gap-3 shadow-warm-sm">
          <div className="w-8 h-8 border-3 border-[#C96D3B] border-t-transparent rounded-full animate-spin"></div>
          <span>Solving multi-objective water allocation subject to hard constraints...</span>
        </div>
      )}

      {error && (
        <div className="bg-[#B95B55]/10 border border-[#B95B55]/30 rounded-2xl p-4 text-xs text-[#8A3C37] flex items-start gap-2.5 shadow-warm-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#B95B55]" />
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
            <div className="bg-[#FFFCF6] p-4 sm:p-5 rounded-2xl border border-[#E8D6C5] shadow-warm-sm">
              <div className="text-xs text-[#817064] font-medium">Requested Budget</div>
              <div className="text-2xl font-extrabold text-[#382A25] font-display mt-1">
                {plan.requested_budget_m3.toFixed(1)} <span className="text-xs font-semibold text-[#817064]">m³</span>
              </div>
              <div className="text-[11px] text-[#9D8D82] mt-1">Available cluster quota</div>
            </div>

            <div className="bg-[#FFFCF6] p-4 sm:p-5 rounded-2xl border border-[#E8D6C5] shadow-warm-sm">
              <div className="text-xs text-[#817064] font-medium">Total Allocated</div>
              <div className="text-2xl font-extrabold text-[#C96D3B] font-display mt-1">
                {plan.total_allocated_m3.toFixed(1)} <span className="text-xs font-semibold text-[#817064]">m³</span>
              </div>
              <div className="text-[11px] text-[#85845A] font-bold mt-1">
                {plan.budget_utilization_pct.toFixed(1)}% Utilized
              </div>
            </div>

            <div className="bg-[#FFFCF6] p-4 sm:p-5 rounded-2xl border border-[#E8D6C5] shadow-warm-sm">
              <div className="text-xs text-[#817064] font-medium">Unallocated Remainder</div>
              <div className="text-2xl font-extrabold text-[#69483A] font-display mt-1">
                {plan.unallocated_remainder_m3.toFixed(1)} <span className="text-xs font-semibold text-[#817064]">m³</span>
              </div>
              <div className="text-[11px] text-[#9D8D82] mt-1">Conserved reservoir margin</div>
            </div>

            <div className="bg-[#FFFCF6] p-4 sm:p-5 rounded-2xl border border-[#E8D6C5] shadow-warm-sm">
              <div className="text-xs text-[#817064] font-medium">Constraint Verification</div>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-[#585736] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#85845A]" />
                  <span>Budget: {plan.constraint_checks?.budget_conserved ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#585736] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#85845A]" />
                  <span>Capacities: {plan.constraint_checks?.capacities_respected ? 'PASS' : 'FAIL'}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[#585736] font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#85845A]" />
                  <span>Pause Safe: {plan.constraint_checks?.paused_fields_zero_allocation ? 'PASS' : 'FAIL'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Side-by-Side Baseline Comparison Card in Deep Cocoa */}
          <div className="bg-[#382A25] rounded-2xl p-6 text-[#FFFCF6] shadow-warm-md border border-[#69483A]">
            <div className="flex items-center gap-2.5 mb-2.5">
              <Scale className="w-5 h-5 text-[#E5B94B]" />
              <h3 className="text-sm font-bold tracking-wide uppercase text-[#E5B94B] font-display">
                Agronomic Decision Advantage: AI Prioritization vs Equal Allocation
              </h3>
            </div>

            <p className="text-xs text-[#E8D6C5] leading-relaxed mb-4">
              {plan.baseline_comparison.narrative}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#69483A] text-xs">
              <div className="bg-[#2C201C] rounded-xl p-3.5 border border-[#69483A]">
                <div className="text-[#E8D6C5] font-medium">High/Crit Risk Allocation Share</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#E5B94B] font-display">
                    {plan.baseline_comparison.ai_high_risk_share_pct.toFixed(0)}%
                  </span>
                  <span className="text-[#9D8D82] text-xs font-mono">
                    vs {plan.baseline_comparison.baseline_high_risk_share_pct.toFixed(0)}% Baseline
                  </span>
                </div>
                <div className="text-[11px] text-[#E8D6C5]/70 mt-1">
                  Targeted at vulnerable crops
                </div>
              </div>

              <div className="bg-[#2C201C] rounded-xl p-3.5 border border-[#69483A]">
                <div className="text-[#E8D6C5] font-medium">Water Volume to High-Risk Fields</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#E5B94B] font-display">
                    {plan.baseline_comparison.ai_high_risk_allocation_m3.toFixed(1)} m³
                  </span>
                  <span className="text-[#9D8D82] text-xs font-mono">
                    vs {plan.baseline_comparison.baseline_high_risk_allocation_m3.toFixed(1)} m³
                  </span>
                </div>
                <div className="text-[11px] text-[#E8D6C5]/70 mt-1">
                  Prevents catastrophic yield loss
                </div>
              </div>

              <div className="bg-[#2C201C] rounded-xl p-3.5 border border-[#69483A]">
                <div className="text-[#E8D6C5] font-medium">Top-Stressed Fields Funded</div>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-extrabold text-[#E5B94B] font-display">
                    {plan.baseline_comparison.top_stressed_fields_funded_ai}
                  </span>
                  <span className="text-[#9D8D82] text-xs font-mono">
                    vs {plan.baseline_comparison.top_stressed_fields_funded_baseline} Baseline
                  </span>
                </div>
                <div className="text-[11px] text-[#E8D6C5]/70 mt-1">
                  Fields receiving required irrigation
                </div>
              </div>
            </div>
          </div>

          {/* Ranked Allocation Table */}
          <div className="bg-[#FFFCF6] rounded-2xl border border-[#E8D6C5] shadow-warm-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-[#E8D6C5] bg-[#FAF5ED] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#382A25] font-display">
                  Priority-Ranked Field Allocation Roster
                </h3>
                <p className="text-xs text-[#817064]">
                  Fields sorted in decreasing order of stress priority and physiological water deficit.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-3 py-1 rounded-md bg-[#FFFCF6] text-[#382A25] border border-[#E8D6C5]">
                10 Fields Monitored
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF5ED] text-[#382A25] font-bold border-b border-[#E8D6C5]">
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
                <tbody className="divide-y divide-[#E8D6C5]/60 text-[#69483A]">
                  {plan.allocations.map((alloc) => (
                    <tr key={alloc.field_id} className="hover:bg-[#FAF5ED]/50 transition-colors">
                      <td className="p-3 font-mono font-bold text-[#C96D3B]">
                        #{alloc.priority_rank}
                      </td>
                      <td className="p-3 font-medium">
                        <span className="font-mono font-bold text-[#382A25]">{alloc.field_id}</span>
                        <div className="text-[11px] text-[#817064]">{alloc.field_name}</div>
                      </td>
                      <td className="p-3">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            alloc.risk_level === 'Critical' || alloc.risk_level === 'High'
                              ? 'bg-[#B95B55]/15 text-[#8A3C37]'
                              : alloc.risk_level === 'Moderate'
                              ? 'bg-[#E5B94B]/20 text-[#69483A]'
                              : 'bg-[#85845A]/15 text-[#585736]'
                          }`}
                        >
                          {alloc.risk_level} ({alloc.risk_score.toFixed(1)})
                        </span>
                      </td>
                      <td className="p-3">{getStatusBadge(alloc.stress_status)}</td>
                      <td className="p-3 font-mono">{alloc.requested_demand_m3.toFixed(1)}</td>
                      <td className="p-3 font-mono font-bold text-[#C96D3B]">
                        {alloc.allocated_volume_m3.toFixed(1)}
                      </td>
                      <td className="p-3 font-mono text-[#817064]">{alloc.capacity_limit_m3.toFixed(1)}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-[#E8D6C5]/50 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-[#C96D3B] h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, alloc.allocation_percentage)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-[#382A25]">
                            {alloc.allocation_percentage.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-[#69483A] max-w-xs">{alloc.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Planning Aid Disclaimer */}
          <div className="p-4 bg-[#FAF5ED] rounded-2xl text-[11px] text-[#817064] flex items-start gap-2.5 border border-[#E8D6C5]">
            <Info className="w-4 h-4 text-[#C96D3B] shrink-0 mt-0.5" />
            <span>{plan.disclaimer}</span>
          </div>
        </>
      )}
    </div>
  );
};
