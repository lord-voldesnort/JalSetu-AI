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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D32F2F]/15 text-[#D32F2F] border border-[#D32F2F]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F] animate-ping"></span>
            Critical / High
          </span>
        );
      case 'amber':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]"></span>
            Moderate Stress
          </span>
        );
      case 'blue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#299BCB]/15 text-[#123B66] border border-[#299BCB]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#299BCB]"></span>
            Paused (Deluge)
          </span>
        );
      case 'green':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#438653]/15 text-[#245C38] border border-[#438653]/40">
            <span className="w-1.5 h-1.5 rounded-full bg-[#438653]"></span>
            Low / Nominal
          </span>
        );
    }
  };

  const getActionStyle = (action?: string) => {
    switch (action) {
      case 'irrigate_now':
        return 'bg-[#299BCB]/15 text-[#123B66] border-[#299BCB]/40 font-bold';
      case 'wait':
        return 'bg-[#F5F8FC] text-[#64748B] border-[#E2E8F0] font-medium';
      case 'inspect':
        return 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/40 font-bold';
      case 'protect_pause':
        return 'bg-[#299BCB]/20 text-[#123B66] border-[#299BCB]/50 font-bold';
      default:
        return 'bg-[#F5F8FC] text-[#64748B] border-[#E2E8F0]';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-ocean-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search field ID, name, crop (e.g. tomato, PC-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30 focus:border-[#299BCB] transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-[#F5F8FC] p-1 rounded-xl border border-[#E2E8F0]">
            <Filter className="w-3.5 h-3.5 text-[#64748B] ml-1 mr-0.5" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 ${
                statusFilter === 'all'
                  ? 'bg-[#123B66] text-[#FFFFFF] shadow-ocean-sm'
                  : 'bg-[#FFFFFF] text-[#334155] hover:text-[#123B66] hover:bg-[#F5F8FC] border border-[#CBD5E1]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('red')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/40 ${
                statusFilter === 'red'
                  ? 'bg-[#D32F2F] text-[#FFFFFF] shadow-ocean-sm'
                  : 'bg-[#FFFFFF] text-[#D32F2F] hover:bg-[#F5F8FC] border border-[#CBD5E1]'
              }`}
            >
              High/Crit
            </button>
            <button
              onClick={() => setStatusFilter('amber')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#D97706]/40 ${
                statusFilter === 'amber'
                  ? 'bg-[#D97706] text-[#FFFFFF] shadow-ocean-sm'
                  : 'bg-[#FFFFFF] text-[#D97706] hover:bg-[#F5F8FC] border border-[#CBD5E1]'
              }`}
            >
              Mod
            </button>
            <button
              onClick={() => setStatusFilter('green')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#438653]/40 ${
                statusFilter === 'green'
                  ? 'bg-[#438653] text-[#FFFFFF] shadow-ocean-sm'
                  : 'bg-[#FFFFFF] text-[#245C38] hover:bg-[#F5F8FC] border border-[#CBD5E1]'
              }`}
            >
              Low
            </button>
            <button
              onClick={() => setStatusFilter('blue')}
              className={`font-inter font-semibold text-[13px] sm:text-[14px] px-3 py-1.5 rounded-lg transition-all duration-150 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 ${
                statusFilter === 'blue'
                  ? 'bg-[#299BCB] text-[#FFFFFF] shadow-ocean-sm'
                  : 'bg-[#FFFFFF] text-[#123B66] hover:bg-[#F5F8FC] border border-[#CBD5E1]'
              }`}
            >
              Paused
            </button>
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-[#FFFFFF] border border-[#CBD5E1] text-[#0F172A] font-medium rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
          >
            <option value="all">All Actions</option>
            <option value="irrigate_now">Irrigate Now</option>
            <option value="wait">Wait</option>
            <option value="inspect">Inspect</option>
            <option value="protect_pause">Protect / Pause</option>
          </select>
        </div>
      </div>

      {/* Field Cards Grid with Agricultural Green Fields and Blue Percentage Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFields.map((feat) => {
          const p = feat.properties;
          const isSelected = selectedFieldId === p.id;
          const probPct = Math.round((p.stress_probability || 0) * 100);

          return (
            <div
              key={p.id}
              className={`bg-[#FFFFFF] rounded-2xl border p-4 sm:p-5 transition-all duration-200 flex flex-col justify-between shadow-ocean-sm hover:shadow-ocean-md ${
                isSelected
                  ? 'border-[#F29A38] ring-2 ring-[#F29A38]/30 bg-[#F5F8FC]'
                  : 'border-[#E2E8F0] hover:border-[#299BCB]/50'
              }`}
            >
              <div>
                {/* Field Header: Green agricultural plot identification */}
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-[#245C38] bg-[#E8F2E5] px-2.5 py-0.5 rounded-md border border-[#78AD76]/50">
                      {p.id}
                    </span>
                    <h3 className="font-bold text-[#123B66] text-sm mt-1.5 font-display">
                      {p.name}
                    </h3>
                  </div>
                  <div>{getStatusBadge(p.stress_status)}</div>
                </div>

                {/* Crop & Agronomic Specs (Green Crop Indicators) */}
                <div className="text-xs text-[#334155] space-y-1.5 mb-3.5 bg-[#F5F8FC] p-2.5 rounded-xl border border-[#E2E8F0]">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Cultivated Crop:</span>
                    <span className="font-semibold text-[#245C38] bg-[#E8F2E5] px-2 py-0.5 rounded border border-[#78AD76]/40 capitalize">
                      {p.crop} ({p.stage})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B]">Plot Area:</span>
                    <span className="font-semibold text-[#123B66]">
                      {p.area_acres} acres ({p.area_ha || (p.area_acres * 0.4047).toFixed(2)} ha)
                    </span>
                  </div>
                </div>

                {/* Percentage Bar: Blue shades with Pale Blue track (Part 3) */}
                <div className="mb-3.5 bg-[#FFFFFF] p-3 rounded-xl border border-[#E2E8F0]">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="text-[#334155] font-medium">Stress Index:</span>
                    <span className="font-bold text-[#1976B9] font-mono">{probPct}%</span>
                  </div>
                  <div className="w-full bg-[#DCEFF8] rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full transition-all duration-500 bg-[#299BCB]"
                      style={{ width: `${Math.min(100, Math.max(5, probPct))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Recommendation Pill */}
                <div className="mb-4">
                  <div className="text-[11px] text-[#64748B] mb-1">Prescribed Action:</div>
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
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#E2E8F0]">
                <button
                  onClick={() => onSelectField(p.id)}
                  className="font-inter font-semibold text-[14px] bg-[#299BCB] hover:bg-[#2184AD] active:scale-[0.98] text-[#FFFFFF] px-3 py-2 rounded-xl shadow-ocean-sm border border-transparent transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40"
                  title="Inspect agronomic driver signals"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Explain</span>
                </button>
                <button
                  onClick={() => onViewForecast(p.id)}
                  className="font-inter font-semibold text-[14px] bg-[#FFFFFF] hover:bg-[#F5F8FC] active:scale-[0.98] text-[#123B66] hover:text-[#299BCB] border border-[#CBD5E1] hover:border-[#299BCB] px-3 py-2 rounded-xl shadow-ocean-sm transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
                  title="View 3-7 day risk projection"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-[#299BCB]" />
                  <span>Forecast</span>
                </button>
                <button
                  onClick={() => onQuickLog(p.id)}
                  className="font-inter font-semibold text-[14px] bg-[#FFFFFF] hover:bg-[#E8F2E5] active:scale-[0.98] text-[#245C38] hover:text-[#174026] border border-[#78AD76]/60 hover:border-[#438653] px-3 py-2 rounded-xl shadow-crop-sm transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#438653]/30"
                  title="Record field irrigation action"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#438653]" />
                  <span>Record</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFields.length === 0 && (
        <div className="text-center py-12 bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 shadow-ocean-sm">
          <AlertTriangle className="w-8 h-8 text-[#299BCB] mx-auto mb-2" />
          <h4 className="font-bold text-[#123B66] text-sm">No fields match your filter</h4>
          <p className="text-xs text-[#64748B] mt-1">
            Try adjusting your search query or status/action filters.
          </p>
        </div>
      )}
    </div>
  );
};
