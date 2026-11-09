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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-200">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
            Critical / High
          </span>
        );
      case 'amber':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
            Moderate Stress
          </span>
        );
      case 'blue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            Paused (Heavy Rain)
          </span>
        );
      case 'green':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Low / Nominal
          </span>
        );
    }
  };

  const getActionStyle = (action?: string) => {
    switch (action) {
      case 'irrigate_now':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'wait':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'inspect':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'protect_pause':
        return 'bg-blue-50 text-blue-800 border-blue-300 font-semibold';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search field ID, name, crop (e.g. tomato, PC-001)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1" />
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('red')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                statusFilter === 'red'
                  ? 'bg-red-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-red-700'
              }`}
            >
              High/Crit
            </button>
            <button
              onClick={() => setStatusFilter('amber')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                statusFilter === 'amber'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Mod
            </button>
            <button
              onClick={() => setStatusFilter('green')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                statusFilter === 'green'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Low
            </button>
            <button
              onClick={() => setStatusFilter('blue')}
              className={`px-2 py-1 rounded font-medium transition-colors ${
                statusFilter === 'blue'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-blue-700'
              }`}
            >
              Paused
            </button>
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="text-xs bg-white border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
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
              className={`bg-white rounded-xl border p-4 transition-all duration-200 flex flex-col justify-between shadow-xs hover:shadow-md ${
                isSelected
                  ? 'border-teal-600 ring-2 ring-teal-500/20 bg-teal-50/10'
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                      {p.id}
                    </span>
                    <h3 className="font-semibold text-slate-800 text-sm mt-1">
                      {p.name}
                    </h3>
                  </div>
                  <div>{getStatusBadge(p.stress_status)}</div>
                </div>

                {/* Crop & Agronomic Specs */}
                <div className="text-xs text-slate-600 space-y-1 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Crop:</span>
                    <span className="font-medium text-slate-700 capitalize">
                      {p.crop} ({p.stage})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Area:</span>
                    <span className="font-medium text-slate-700">
                      {p.area_acres} acres ({p.area_ha || (p.area_acres * 0.4047).toFixed(2)} ha)
                    </span>
                  </div>
                </div>

                {/* Stress Index Meter */}
                <div className="mb-3 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-slate-600 font-medium">Stress Index:</span>
                    <span className="font-bold text-slate-800">{probPct}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        p.stress_status === 'red'
                          ? 'bg-red-500'
                          : p.stress_status === 'amber'
                          ? 'bg-amber-500'
                          : p.stress_status === 'blue'
                          ? 'bg-blue-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, probPct))}%` }}
                    ></div>
                  </div>
                </div>

                {/* Recommendation Pill */}
                <div className="mb-4">
                  <div className="text-[11px] text-slate-500 mb-1">Recommendation:</div>
                  <div
                    className={`text-xs px-2.5 py-1.5 rounded-md border text-center font-medium ${getActionStyle(
                      p.recommended_action
                    )}`}
                  >
                    {p.recommended_action?.replace('_', ' ').toUpperCase() || 'WAIT'}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-xs">
                <button
                  onClick={() => onSelectField(p.id)}
                  className="px-2 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium text-center transition-colors flex items-center justify-center gap-1 shadow-xs"
                  title="Inspect agronomic driver signals"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Explain</span>
                </button>
                <button
                  onClick={() => onViewForecast(p.id)}
                  className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium text-center transition-colors flex items-center justify-center gap-1"
                  title="View 3-7 day risk projection"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Forecast</span>
                </button>
                <button
                  onClick={() => onQuickLog(p.id)}
                  className="px-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-medium text-center transition-colors flex items-center justify-center gap-1"
                  title="Record field irrigation action"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Record</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredFields.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-6">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <h4 className="font-semibold text-slate-800 text-sm">No fields match your filter</h4>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or status/action filters.
          </p>
        </div>
      )}
    </div>
  );
};
