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
        return { label: 'Shock: Heat + Drought', icon: Sun, color: 'bg-[#D32F2F]/20 text-[#FFCDD2] border-[#D32F2F]/40' };
      case 'heavy_rain_pause_01':
        return { label: 'Shock: Deluge Pause', icon: CloudRain, color: 'bg-[#299BCB]/20 text-[#DCEFF8] border-[#299BCB]/40' };
      case 'normal_01':
      default:
        return { label: 'Baseline: Normal', icon: ShieldCheck, color: 'bg-[#438653]/25 text-[#C8E6C9] border-[#438653]/40' };
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
    <header className="bg-[#123B66] text-[#FFFFFF] shadow-md border-b border-[#299BCB]/30 sticky top-0 z-40">
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#299BCB] to-[#76C4E5] flex items-center justify-center text-white shadow-ocean-sm border border-[#76C4E5]/30 transition-transform group-hover:scale-105">
            <Droplets className="w-5 h-5 text-[#FFFFFF]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg tracking-tight font-display text-[#FFFFFF]">
                JalSetu <span className="text-[#76C4E5]">AI</span>
              </span>
              <span className="bg-[#299BCB]/30 text-[#DCEFF8] text-[10px] px-2 py-0.5 rounded-full font-mono border border-[#76C4E5]/40 tracking-wider">
                COPILOT
              </span>
            </div>
            <p className="text-[11px] text-[#CBD5E1] hidden md:block">
              Climate-Resilience Water Allocation Copilot
            </p>
          </div>
        </div>

        {/* Global Controls & Status */}
        <div className="flex items-center space-x-2 sm:space-x-3 text-xs">
          {/* Active Scenario Indicator Button */}
          <button
            onClick={() => onTabChange('scenarios')}
            className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-inter font-semibold text-[13px] transition-all duration-150 shadow-ocean-sm active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 hover:brightness-110 ${scen.color}`}
            title="Click to view or replay climate scenarios"
          >
            <ScenIcon className="w-3.5 h-3.5" />
            <span>{scen.label}</span>
          </button>

          {/* As-Of Date Badge */}
          <div className="hidden lg:flex items-center space-x-1.5 bg-[#0D2A4A] px-3 py-1.5 rounded-lg border border-[#299BCB]/30 text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-[#76C4E5]" />
            <span className="text-[#CBD5E1]">As-Of: <strong className="text-[#FFFFFF]">2026-10-08</strong></span>
          </div>

          {/* Operator Role Selector */}
          <div className="flex items-center space-x-1.5 bg-[#0D2A4A] px-2.5 py-1.5 rounded-lg border border-[#299BCB]/30 text-[#CBD5E1]">
            <UserCheck className="w-3.5 h-3.5 text-[#76C4E5]" />
            <select
              value={userRole}
              onChange={(e) => onRoleChange(e.target.value)}
              className="bg-transparent text-xs text-[#FFFFFF] font-medium focus:outline-none cursor-pointer"
            >
              <option value="farmer" className="bg-[#123B66] text-[#FFFFFF]">Role: Farmer</option>
              <option value="water_manager" className="bg-[#123B66] text-[#FFFFFF]">Role: Water Manager</option>
              <option value="agronomist" className="bg-[#123B66] text-[#FFFFFF]">Role: Agronomist</option>
            </select>
          </div>

          {/* Backend Health Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition-colors ${
              health?.status === 'ok'
                ? 'bg-[#438653]/30 text-[#C8E6C9] border-[#438653]/50'
                : healthLoading
                ? 'bg-[#D97706]/20 text-[#FFE082] border-[#D97706]/40'
                : 'bg-[#D32F2F]/30 text-[#FFCDD2] border-[#D32F2F]/60'
            }`}
            title={health ? `FastAPI connected (${health.database})` : 'Backend offline or connecting...'}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                health?.status === 'ok'
                  ? 'bg-[#438653] animate-pulse'
                  : healthLoading
                  ? 'bg-[#D97706] animate-ping'
                  : 'bg-[#D32F2F]'
              }`}
            ></span>
            <span className="hidden sm:inline">
              {health?.status === 'ok' ? 'API Online' : healthLoading ? 'Connecting' : 'Offline'}
            </span>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-[#E2E8F0] bg-[#0D2A4A] hover:bg-[#299BCB]/30 active:scale-[0.98] border border-[#299BCB]/30 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40"
            aria-label="Toggle mobile navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Desktop Workspace Navigation Tabs */}
      <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-t border-[#299BCB]/30 overflow-x-auto">
        <nav className="flex space-x-1.5 py-2 text-xs font-medium">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`px-4 py-2 rounded-xl transition-all duration-150 inline-flex items-center gap-2 whitespace-nowrap font-inter font-semibold text-[14px] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 ${
                  isActive
                    ? 'bg-[#FFFFFF] text-[#123B66] shadow-ocean-sm border border-[#CBD5E1]'
                    : 'text-[#E2E8F0] hover:text-[#FFFFFF] hover:bg-[#299BCB]/20 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#299BCB]' : 'text-[#76C4E5]'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Workspace Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#299BCB]/30 bg-[#0D2A4A] px-4 py-3 space-y-2">
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
                className={`w-full text-left px-4 py-2.5 rounded-xl transition-all duration-150 inline-flex items-center gap-2.5 font-inter font-semibold text-[14px] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 ${
                  isActive
                    ? 'bg-[#299BCB] text-[#FFFFFF] shadow-ocean-sm'
                    : 'text-[#E2E8F0] hover:bg-[#123B66]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 border-t border-[#299BCB]/30 flex justify-between items-center text-xs text-[#CBD5E1]">
            <span>Active Scenario:</span>
            <span className="font-mono text-[11px] text-[#76C4E5]">{scen.label}</span>
          </div>
        </div>
      )}
    </header>
  );
};
