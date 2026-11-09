import React, { useState } from 'react';
import { Droplets, Calendar, UserCheck, ShieldCheck, Activity, AlertTriangle, Layers, Menu, X, CloudRain, Sun } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getScenarioLabel = (id: string) => {
    switch (id) {
      case 'rainfall_deficit_heat_01':
        return { label: 'Shock: Heat + Drought', icon: Sun, color: 'bg-[#B95B55]/20 text-[#D99A91] border-[#B95B55]/40' };
      case 'heavy_rain_pause_01':
        return { label: 'Shock: Deluge Pause', icon: CloudRain, color: 'bg-blue-900/40 text-blue-200 border-blue-700/40' };
      case 'normal_01':
      default:
        return { label: 'Baseline: Normal', icon: ShieldCheck, color: 'bg-[#85845A]/25 text-[#E8D6C5] border-[#85845A]/40' };
    }
  };

  const scen = getScenarioLabel(activeScenarioId);
  const ScenIcon = scen.icon;

  const navItems: { id: AppTab; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'observe', label: '1. Field Monitoring & Map', icon: Layers },
    { id: 'forecast', label: '2. 3–7 Day Forecast', icon: Activity },
    { id: 'scenarios', label: '3. Climate Shock Simulator', icon: AlertTriangle },
    { id: 'planner', label: '4. Water Budget Planner', icon: Droplets },
    { id: 'audit', label: '5. Audit Trail & Metrics', icon: ShieldCheck },
  ];

  return (
    <header className="bg-[#382A25] text-[#FFFCF6] shadow-md border-b border-[#69483A] sticky top-0 z-40">
      {/* Top Brand Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Identity */}
        <div
          className="flex items-center space-x-3 cursor-pointer group"
          onClick={() => {
            onTabChange('observe');
            setMobileMenuOpen(false);
          }}
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C96D3B] to-[#B95B55] flex items-center justify-center text-white shadow-warm-sm border border-[#E8D6C5]/20 transition-transform group-hover:scale-105">
            <Droplets className="w-5 h-5 text-[#FFFCF6]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight font-display text-[#FFFCF6]">
                JalSetu <span className="text-[#E5B94B]">AI</span>
              </span>
              <span className="bg-[#B95B55]/25 text-[#E8D6C5] text-[10px] px-2 py-0.5 rounded-full font-mono border border-[#B95B55]/40 tracking-wider">
                COPILOT
              </span>
            </div>
            <p className="text-[11px] text-[#E8D6C5]/80 hidden md:block">
              Climate-Resilience Water Allocation Copilot
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          {/* Active Scenario Indicator Button */}
          <button
            onClick={() => onTabChange('scenarios')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-inter font-semibold text-[13px] transition-all duration-150 shadow-warm-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40 hover:brightness-110 ${scen.color}`}
            title="Click to view or replay climate scenarios"
          >
            <ScenIcon className="w-3.5 h-3.5" />
            <span>{scen.label}</span>
          </button>

          {/* As-Of Date Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-[#2C201C] px-3 py-1.5 rounded-lg border border-[#69483A] text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-[#E5B94B]" />
            <span className="text-[#E8D6C5]">As-Of: <strong className="text-[#FFFCF6]">2026-10-08</strong></span>
          </div>

          {/* Operator Role Selector */}
          <div className="flex items-center space-x-1.5 bg-[#2C201C] px-2.5 py-1.5 rounded-lg border border-[#69483A] text-[#E8D6C5]">
            <UserCheck className="w-3.5 h-3.5 text-[#C96D3B]" />
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="bg-transparent text-xs text-[#FFFCF6] font-medium focus:outline-none cursor-pointer"
            >
              <option value="farmer" className="bg-[#382A25] text-[#FFFCF6]">Role: Farmer</option>
              <option value="water_manager" className="bg-[#382A25] text-[#FFFCF6]">Role: Water Manager</option>
              <option value="agronomist" className="bg-[#382A25] text-[#FFFCF6]">Role: Agronomist</option>
            </select>
          </div>

          {/* Backend Health Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-colors ${
              health?.status === 'ok'
                ? 'bg-[#85845A]/25 text-[#E8D6C5] border-[#85845A]/50'
                : healthLoading
                ? 'bg-[#E5B94B]/20 text-[#E5B94B] border-[#E5B94B]/40'
                : 'bg-[#B95B55]/30 text-[#D99A91] border-[#B95B55]/60'
            }`}
            title={health ? `FastAPI connected (${health.database})` : 'Backend offline or connecting...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'ok'
                  ? 'bg-[#85845A] animate-pulse'
                  : healthLoading
                  ? 'bg-[#E5B94B] animate-ping'
                  : 'bg-[#B95B55]'
              }`}
            ></span>
            <span className="hidden sm:inline">
              {health?.status === 'ok' ? 'API Online' : healthLoading ? 'Connecting' : 'Offline'}
            </span>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#E8D6C5] bg-[#382A25] hover:bg-[#69483A]/50 active:scale-[0.98] border border-[#69483A] transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Workspace Navigation Tabs */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#69483A]/70 overflow-x-auto">
        <nav className="flex space-x-1.5 py-2 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-2 rounded-xl transition-all duration-150 inline-flex items-center gap-2 whitespace-nowrap font-inter font-semibold text-[14px] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40 ${
                  isActive
                    ? 'bg-[#FFFCF6] text-[#382A25] shadow-warm-sm border border-[#E8D6C5]'
                    : 'text-[#E8D6C5] hover:text-[#FFFCF6] hover:bg-[#69483A]/40 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#C96D3B]' : 'text-[#D99A91]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Workspace Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#69483A] bg-[#2C201C] px-4 py-3 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-2.5 font-inter font-semibold text-[14px] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40 ${
                  isActive
                    ? 'bg-[#C96D3B] text-[#FFFCF6] shadow-warm-sm'
                    : 'text-[#E8D6C5] hover:bg-[#382A25]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-[#69483A]/50 flex justify-between items-center text-xs text-[#E8D6C5]">
            <span>Active Scenario:</span>
            <span className="font-mono text-[11px] text-[#E5B94B]">{scen.label}</span>
          </div>
        </div>
      )}
    </header>
  );
};
