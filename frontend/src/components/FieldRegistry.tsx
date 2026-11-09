import React, { useState, useMemo } from 'react';
import { FieldFeatureCollection } from '../types/api';
import {
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText
} from 'lucide-react';

interface FieldRegistryProps {
  fields: FieldFeatureCollection | null;
  selectedFieldId: string | null;
  onSelectField: (fieldId: string) => void;
  onViewForecast: (fieldId: string) => void;
  onQuickLog: (fieldId: string) => void;
}

export const FieldRegistry: React.FC<FieldRegistryProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  onViewForecast,
  onQuickLog,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredFields = useMemo(() => {
    if (!fields?.features) return [];
    return fields.features.filter((feat) => {
      const p = feat.properties;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.id.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.crop.toLowerCase().includes(q) ||
        p.stage.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' || p.stress_status === statusFilter;

      const matchesAction =
        actionFilter === 'all' || p.recommended_action === actionFilter;

      return matchesSearch && matchesStatus && matchesAction;
    });
  }, [fields, searchQuery, statusFilter, actionFilter]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'red':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#B95B55]/15 text-[#8A3C37] border border-[#B95B55]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B95B55] animate-ping"></span>
            Critical / High
          </span>
        );
      case 'amber':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E5B94B]/20 text-[#69483A] border border-[#E5B94B]/50">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5B94B]"></span>
            Moderate Stress
          </span>
        );
      case 'blue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Paused (Heavy Rain)
          </span>
        );
      case 'green':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#85845A]/15 text-[#585736] border border-[#85845A]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#85845A]"></span>
            Low / Nominal
          </span>
        );
    }
  };

  const getActionStyle = (action?: string) => {
    switch (action) {
      case 'irrigate_now':
        return 'bg-[#C96D3B]/10 text-[#C96D3B] border-[#C96D3B]/40 font-bold';
      case 'wait':
        return 'bg-[#FAF5ED] text-[#817064] border-[#E8D6C5] font-medium';
      case 'inspect':
        return 'bg-[#E5B94B]/20 text-[#69483A] border-[#E5B94B]/50 font-bold';
      case 'protect_pause':
        return 'bg-blue-50 text-blue-900 border-blue-300 font-bold';
      default:
        return 'bg-[#FAF5ED] text-[#817064] border-[#E8D6C5]';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-[#FFFCF6] p-4 rounded-2xl border border-[#E8D6C5] shadow-warm-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#817064] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search field ID, name, crop (e.g. tomato, PC-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#E8D6C5] bg-[#FFFCF6] text-[#2C201C] placeholder-[#9D8D82] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30 focus:border-[#C96D3B] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#FAF5ED] p-1 rounded-xl border border-[#E8D6C5]">
            <Filter className="w-3.5 h-3.5 text-[#817064] ml-1 mr-0.5" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40 ${
                statusFilter === 'all'
                  ? 'bg-[#C96D3B] text-[#FFFCF6] shadow-warm-sm'
                  : 'bg-[#FFFCF6] text-[#69483A] hover:text-[#2C201C] hover:bg-[#FAF5ED] border border-[#E8D6C5]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('red')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#B95B55]/40 ${
                statusFilter === 'red'
                  ? 'bg-[#B95B55] text-[#FFFCF6] shadow-warm-sm'
                  : 'bg-[#FFFCF6] text-[#69483A] hover:text-[#B95B55] hover:bg-[#FAF5ED] border border-[#E8D6C5]'
              }`}
            >
              High/Crit
            </button>
            <button
              onClick={() => setStatusFilter('amber')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#E5B94B]/40 ${
                statusFilter === 'amber'
                  ? 'bg-[#E5B94B] text-[#382A25] shadow-warm-sm'
                  : 'bg-[#FFFCF6] text-[#69483A] hover:text-[#69483A] hover:bg-[#FAF5ED] border border-[#E8D6C5]'
              }`}
            >
              Mod
            </button>
            <button
              onClick={() => setStatusFilter('green')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#85845A]/40 ${
                statusFilter === 'green'
                  ? 'bg-[#85845A] text-[#FFFCF6] shadow-warm-sm'
                  : 'bg-[#FFFCF6] text-[#69483A] hover:text-[#85845A] hover:bg-[#FAF5ED] border border-[#E8D6C5]'
              }`}
            >
              Low
            </button>
            <button
              onClick={() => setStatusFilter('blue')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500/40 ${
                statusFilter === 'blue'
                  ? 'bg-[#4B729F] text-[#FFFCF6] shadow-warm-sm'
                  : 'bg-[#FFFCF6] text-[#69483A] hover:text-[#4B729F] hover:bg-[#FAF5ED] border border-[#E8D6C5]'
              }`}
            >
              Paused
            </button>
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-[#FFFCF6] border border-[#E8D6C5] text-[#2C201C] font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
          >
            <option value="all">All Actions</option>
            <option value="irrigate_now">Irrigate Now</option>
            <option value="wait">Wait</option>
            <option value="inspect">Inspect</option>
            <option value="protect_pause">Protect / Pause</option>
          </select>
        </div>
      </div>

      {/* Field Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFields.map((feat) => {
          const p = feat.properties;
          const isSelected = selectedFieldId === p.id;
          const probPct = Math.round((p.stress_probability || 0) * 100);

          return (
            <div
              key={p.id}
              className={`bg-[#FFFCF6] rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between shadow-warm-sm hover:shadow-warm-md ${
                isSelected
                  ? 'border-[#C96D3B] ring-2 ring-[#C96D3B]/20 bg-[#F2E1D4]/15'
                  : 'border-[#E8D6C5] hover:border-[#D99A91]'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#C96D3B] bg-[#C96D3B]/10 px-2 py-0.5 rounded-md border border-[#C96D3B]/20">
                      {p.id}
                    </span>
                    <h3 className="font-bold text-[#382A25] text-sm mt-1.5 font-display">
                      {p.name}
                    </h3>
                  </div>
                  <div>{getStatusBadge(p.stress_status)}</div>
                </div>

                {/* Crop & Agronomic Specs */}
                <div className="text-xs text-[#817064] space-y-1 mb-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[#9D8D82]">Crop & Stage:</span>
                    <span className="font-semibold text-[#382A25] capitalize">
                      {p.crop} ({p.stage})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#9D8D82]">Area:</span>
                    <span className="font-semibold text-[#382A25]">
                      {p.area_acres} acres ({p.area_ha || (p.area_acres * 0.4047).toFixed(2)} ha)
                    </span>
                  </div>
                </div>

                {/* Stress Index Meter */}
                <div className="mb-3.5 bg-[#FAF5ED] p-3 rounded-xl border border-[#E8D6C5]/70">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-[#817064] font-medium">Stress Index:</span>
                    <span className="font-bold text-[#382A25] font-mono">{probPct}%</span>
                  </div>
                  <div className="w-full bg-[#E8D6C5]/50 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        p.stress_status === 'red'
                          ? 'bg-[#B95B55]'
                          : p.stress_status === 'amber'
                          ? 'bg-[#E5B94B]'
                          : p.stress_status === 'blue'
                          ? 'bg-[#4B729F]'
                          : 'bg-[#85845A]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, probPct))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Recommendation Pill */}
                <div className="mb-4">
                  <div className="text-[11px] text-[#9D8D82] mb-1">Prescribed Action:</div>
                  <div
                    className={`text-xs px-3 py-1.5 rounded-lg border text-center ${getActionStyle(
                      p.recommended_action
                    )}`}
                  >
                    {p.recommended_action?.replace('_', ' ').toUpperCase() || 'WAIT'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E8D6C5]">
                <button
                  onClick={() => onSelectField(p.id)}
                  className="font-inter font-semibold text-[14px] bg-[#C96D3B] hover:bg-[#B35E30] active:scale-[0.98] text-[#FFFCF6] px-3 py-2 rounded-xl shadow-warm-sm border border-transparent transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40"
                  title="Inspect agronomic driver signals"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Explain</span>
                </button>
                <button
                  onClick={() => onViewForecast(p.id)}
                  className="font-inter font-semibold text-[14px] bg-[#FFFCF6] hover:bg-[#FAF5ED] active:scale-[0.98] text-[#69483A] hover:text-[#382A25] border border-[#E8D6C5] hover:border-[#D99A91] px-3 py-2 rounded-xl shadow-warm-sm transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
                  title="View 3-7 day risk projection"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#C96D3B]" />
                  <span>Forecast</span>
                </button>
                <button
                  onClick={() => onQuickLog(p.id)}
                  className="font-inter font-semibold text-[14px] bg-[#FFFCF6] hover:bg-[#FAF5ED] active:scale-[0.98] text-[#69483A] hover:text-[#382A25] border border-[#E8D6C5] hover:border-[#D99A91] px-3 py-2 rounded-xl shadow-warm-sm transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
                  title="Record field irrigation action"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#85845A]" />
                  <span>Record</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFields.length === 0 && (
        <div className="text-center py-12 bg-[#FFFCF6] rounded-2xl border border-[#E8D6C5] p-6 shadow-warm-sm">
          <AlertTriangle className="w-8 h-8 text-[#C96D3B] mx-auto mb-2" />
          <h4 className="font-bold text-[#382A25] text-sm">No fields match your filter</h4>
          <p className="text-xs text-[#817064] mt-1">
            Try adjusting your search query or status/action filters.
          </p>
        </div>
      )}
    </div>
  );
};
