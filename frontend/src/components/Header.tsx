import React from 'react';
import { Droplets, Calendar, UserCheck, ShieldCheck, Activity, AlertTriangle, Layers } from 'lucide-react';
import { HealthResponse } from '../types/api';

export type AppTab = 'observe' | 'forecast' | 'scenarios' | 'planner' | 'audit';

interface HeaderProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  activeScenarioId: string;
  userRole: string;
  onRoleChange: (role: string) => void;
  health: HealthResponse | null;
  healthLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  activeScenarioId,
  userRole,
  onRoleChange,
  health,
  healthLoading,
}) => {
  const getScenarioLabel = (id: string) => {
    switch (id) {
      case 'rainfall_deficit_heat_01':
        return { label: 'Shock: Heat + Drought', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40' };
      case 'heavy_rain_pause_01':
        return { label: 'Shock: Deluge Pause', color: 'bg-blue-500/20 text-blue-300 border-blue-500/40' };
      case 'normal_01':
      default:
        return { label: 'Baseline: Normal', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' };
    }
  };

  const scen = getScenarioLabel(activeScenarioId);

  return (
    <header className="bg-[#0F2A43] text-white shadow-md border-b border-[#1B3D5C] sticky top-0 z-40">
      {/* Top Banner Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onTabChange('observe')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#005151] to-[#0B8A8F] flex items-center justify-center text-white shadow-inner">
            <Droplets className="w-6 h-6 text-[#9be9e8]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight font-display">JalSetu AI</span>
              <span className="bg-[#0B8A8F]/30 text-[#9be9e8] text-[11px] px-2 py-0.5 rounded-full font-mono border border-[#0B8A8F]/50">
                Decision Prototype
              </span>
            </div>
            <p className="text-[11px] text-slate-300 hidden md:block">
              Agricultural Water Stress & Allocation Copilot
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center space-x-3 text-xs">
          {/* Active Scenario Indicator */}
          <button
            onClick={() => onTabChange('scenarios')}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-mono text-xs transition-colors ${scen.color}`}
            title="Click to change climate scenario"
          >
            <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
            <span>{scen.label}</span>
          </button>

          {/* As-Of Date */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-[#1B3D5C] px-3 py-1.5 rounded-lg border border-slate-700">
            <Calendar className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-slate-300">As-Of: <strong className="text-white">2026-10-08</strong></span>
          </div>

          {/* Role Selector */}
          <div className="flex items-center space-x-1.5 bg-[#005151]/40 px-2 py-1 rounded-lg border border-[#0B8A8F]/40 text-[#9be9e8]">
            <UserCheck className="w-3.5 h-3.5 text-teal-300" />
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="bg-transparent text-xs text-white font-medium focus:outline-none cursor-pointer"
            >
              <option value="farmer" className="bg-[#0F2A43] text-white">Role: Farmer</option>
              <option value="water_manager" className="bg-[#0F2A43] text-white">Role: Water Manager</option>
              <option value="agronomist" className="bg-[#0F2A43] text-white">Role: Agronomist</option>
            </select>
          </div>

          {/* Backend Status Ping */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono ${
              health?.status === 'ok'
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : healthLoading
                ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                : 'bg-red-950/40 text-red-300 border-red-500/40'
            }`}
            title={health ? `FastAPI backend connected (${health.database})` : 'Backend offline or connecting...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'ok'
                  ? 'bg-emerald-400 animate-pulse'
                  : healthLoading
                  ? 'bg-amber-400 animate-ping'
                  : 'bg-red-400'
              }`}
            ></span>
            <span className="hidden sm:inline">
              {health?.status === 'ok' ? 'API Online' : healthLoading ? 'Connecting' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#1B3D5C] overflow-x-auto">
        <nav className="flex space-x-1 sm:space-x-2 py-2 text-xs font-medium">
          <button
            onClick={() => onTabChange('observe')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'observe'
                ? 'bg-teal-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>1. Field Monitoring & Map</span>
          </button>

          <button
            onClick={() => onTabChange('forecast')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'forecast'
                ? 'bg-teal-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>2. 3–7 Day Forecast</span>
          </button>

          <button
            onClick={() => onTabChange('scenarios')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'scenarios'
                ? 'bg-teal-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>3. Climate Shock Simulator</span>
          </button>

          <button
            onClick={() => onTabChange('planner')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'planner'
                ? 'bg-teal-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>4. Water Budget Planner</span>
          </button>

          <button
            onClick={() => onTabChange('audit')}
            className={`px-3.5 py-2 rounded-lg transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'audit'
                ? 'bg-teal-600 text-white shadow-sm font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>5. Audit Trail & Metrics</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
