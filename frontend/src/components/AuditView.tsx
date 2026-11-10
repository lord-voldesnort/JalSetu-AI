import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../api/client';
import {
  ActionEventResponse,
  SystemMetricsResponse,
  ActionEventRequest,
  FieldFeatureCollection,
} from '../types/api';
import {
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Activity,
  PlusCircle,
  ShieldCheck
} from 'lucide-react';

interface AuditViewProps {
  fields: FieldFeatureCollection | null;
  userRole: string;
}

export const AuditView: React.FC<AuditViewProps> = ({ fields, userRole }) => {
  const [events, setEvents] = useState<ActionEventResponse[]>([]);
  const [metrics, setMetrics] = useState<SystemMetricsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Quick Action Form state
  const [showLogForm, setShowLogForm] = useState<boolean>(false);
  const [targetFieldId, setTargetFieldId] = useState<string>('PC-001');
  const [actionTaken, setActionTaken] = useState<string>('irrigate_now');
  const [followed, setFollowed] = useState<boolean>(true);
  const [overrideReason, setOverrideReason] = useState<string>('pump_failure');
  const [actualVolume, setActualVolume] = useState<string>('12.0');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [eventsData, metricsData] = await Promise.all([
        api.getEvents(50),
        api.getMetrics(),
      ]);
      setEvents(eventsData);
      setMetrics(metricsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit history';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followed && !overrideReason) {
      setFormError('An override reason is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFormSuccess(null);
    try {
      const payload: ActionEventRequest = {
        field_id: targetFieldId,
        action_taken: actionTaken,
        followed_recommendation: followed,
        override_reason: followed ? undefined : overrideReason,
        actual_volume_m3: actualVolume ? parseFloat(actualVolume) : undefined,
        user_role: userRole,
        notes: notes || undefined,
      };

      const res = await api.recordEvent(payload);
      setFormSuccess(`Event ${res.event_id} logged successfully for ${targetFieldId}!`);
      setNotes('');
      await loadData();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to submit event';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editorial Hero Banner with Agricultural Photo */}
      <div className="relative rounded-2xl overflow-hidden shadow-ocean-md border border-[#CBD5E1]">
        <img
          src="/images/hero-seedlings.jpg"
          alt="Young seedlings rooted in rich agricultural soil"
          className="absolute inset-0 w-full h-full object-cover object-center"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <div className="relative bg-gradient-to-r from-[#123B66]/95 via-[#123B66]/85 to-[#299BCB]/75 p-6 sm:p-8 text-white">
          <div className="max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#438653]/30 text-[#E8F2E5] backdrop-blur-xs border border-[#78AD76]/40">
              <ShieldCheck className="w-3.5 h-3.5 text-[#76C4E5]" /> Immutable Human-In-The-Loop Governance
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-display text-white">
              Operator Audit Trail & Telemetry
            </h1>
            <p className="text-xs sm:text-sm text-[#F5F8FC]/90 leading-relaxed">
              Permanent logging of actual field actions, compliance tracking, and operator overrides with mandatory causal justifications for continuous agronomic refinement.
            </p>
          </div>
        </div>
      </div>

      {/* Header and Actions Bar */}
      <div className="bg-white rounded-2xl p-5 border border-[#CBD5E1] shadow-ocean-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#299BCB]"></span>
            <h2 className="text-base font-bold text-[#123B66] font-display">
              Audit Trail & Operational Metrics
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Tracking operator adherence rate and real-world deviations from AI recommendations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="font-inter font-semibold text-[14px] px-4 py-2 bg-[#299BCB] hover:bg-[#2184AD] active:scale-[0.98] text-white rounded-xl shadow-ocean-sm border border-transparent transition-all duration-150 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showLogForm ? 'Hide Quick Logger' : 'Log New Action'}</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="font-inter font-semibold p-2.5 bg-white hover:bg-[#F8FAFC] active:scale-[0.98] text-[#123B66] rounded-xl transition-all duration-150 border border-[#CBD5E1] hover:border-[#299BCB] shadow-ocean-sm inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30 disabled:opacity-50"
            title="Refresh events & metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#299BCB]' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-[#D32F2F]/10 border border-[#D32F2F]/30 rounded-2xl p-4 text-xs text-[#D32F2F] flex items-start gap-2.5 shadow-ocean-sm">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-[#D32F2F]" />
          <div>
            <p className="font-bold">Unable to load audit history</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Action Logger Form (Collapsible) */}
      {showLogForm && (
        <div className="bg-white rounded-2xl p-5 border border-[#CBD5E1] shadow-ocean-sm animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-[#123B66] mb-1 flex items-center gap-2 font-display">
            <PlusCircle className="w-4 h-4 text-[#299BCB]" />
            <span>Quick Operator Action Event Recorder</span>
          </h3>
          <p className="text-xs text-[#64748B] mb-4">
            Record a field action taken by <span className="font-bold text-[#299BCB] capitalize">{userRole}</span>.
          </p>

          {formSuccess && (
            <div className="mb-4 p-3.5 bg-[#E8F2E5] border border-[#78AD76]/40 rounded-xl text-xs text-[#245C38] flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#438653]" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3.5 bg-[#D32F2F]/15 border border-[#D32F2F]/40 rounded-xl text-xs text-[#D32F2F] flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-[#D32F2F]" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#123B66] mb-1">
                  Target Field
                </label>
                <select
                  value={targetFieldId}
                  onChange={(e) => setTargetFieldId(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
                >
                  {fields?.features?.map((f) => (
                    <option key={f.properties.id} value={f.properties.id}>
                      {f.properties.id} — {f.properties.name} ({f.properties.crop})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123B66] mb-1">
                  Action Taken
                </label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
                >
                  <option value="irrigate_now">Irrigate Now</option>
                  <option value="wait">Wait / Delay</option>
                  <option value="inspect">Inspect Field</option>
                  <option value="protect_pause">Protect / Pause</option>
                  <option value="other">Other Action</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123B66] mb-1">
                  Applied Volume (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={actualVolume}
                  onChange={(e) => setActualVolume(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
                  placeholder="e.g. 15.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[#123B66] mb-1.5">
                  Followed JalSetu AI Recommendation?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFollowed(true)}
                    className={`font-inter font-semibold text-[14px] py-2.5 px-4 rounded-xl border transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none focus:ring-2 ${
                      followed
                        ? 'bg-[#438653] hover:bg-[#366E44] text-white border-transparent shadow-ocean-sm focus:ring-[#438653]/40'
                        : 'bg-white text-[#123B66] border-[#CBD5E1] hover:bg-[#F8FAFC] hover:border-[#299BCB] focus:ring-[#299BCB]/30'
                    }`}
                  >
                    Yes (Complied)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowed(false)}
                    className={`font-inter font-semibold text-[14px] py-2.5 px-4 rounded-xl border transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none focus:ring-2 ${
                      !followed
                        ? 'bg-[#D32F2F] hover:bg-[#B71C1C] text-white border-transparent shadow-ocean-sm focus:ring-[#D32F2F]/40'
                        : 'bg-white text-[#123B66] border-[#CBD5E1] hover:bg-[#F8FAFC] hover:border-[#299BCB] focus:ring-[#299BCB]/30'
                    }`}
                  >
                    No (Override)
                  </button>
                </div>
              </div>

              {!followed && (
                <div>
                  <label className="block text-xs font-bold text-[#D32F2F] mb-1.5">
                    Override Reason *
                  </label>
                  <select
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-[#D32F2F]/40 bg-[#F5F8FC] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#D32F2F]/30"
                  >
                    <option value="pump_failure">Mechanical pump failure / power outage</option>
                    <option value="canopy_looks_fine">Visual inspection found no visual stress</option>
                    <option value="rain_expected_by_farmer">Farmer intuition / rain expected</option>
                    <option value="scheduled_maintenance">Scheduled canal/drip maintenance</option>
                    <option value="other">Other reason</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <input
                type="text"
                placeholder="Optional notes or observations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex-1 text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-white text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
              />
              <button
                type="submit"
                disabled={submitting}
                className="font-inter font-semibold text-[14px] px-5 py-2.5 bg-[#299BCB] hover:bg-[#2184AD] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl shadow-ocean-sm border border-transparent transition-all duration-150 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40"
              >
                {submitting ? 'Recording...' : 'Save Action Event'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Metrics Strip */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD5E1] shadow-ocean-sm">
            <div className="text-xs text-[#64748B] font-medium">Events Logged</div>
            <div className="text-2xl font-bold text-[#123B66] font-display mt-1">
              {metrics.total_events_logged}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Total operational records</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD5E1] shadow-ocean-sm">
            <div className="text-xs text-[#64748B] font-medium">Operator Adherence</div>
            <div className="text-2xl font-bold text-[#1976B9] font-display mt-1">
              {metrics.adherence_rate_pct.toFixed(0)}%
            </div>
            {/* Percentage Bar in Shades of Blue with Pale Blue Track */}
            <div className="w-full bg-[#DCEFF8] rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[#299BCB] h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, metrics.adherence_rate_pct))}%` }}
              />
            </div>
            <div className="text-[11px] text-[#1976B9] font-bold mt-1">Compliance with AI prescriptives</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD5E1] shadow-ocean-sm">
            <div className="text-xs text-[#64748B] font-medium">Overrides Logged</div>
            <div className="text-2xl font-bold text-[#D32F2F] font-display mt-1">
              {metrics.overrides_logged}
            </div>
            <div className="text-[11px] text-[#94A3B8] mt-1">Human-in-the-loop deviations</div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-[#CBD5E1] shadow-ocean-sm">
            <div className="text-xs text-[#64748B] font-medium">Audit Database</div>
            <div className="text-sm font-mono font-bold text-[#123B66] mt-2">
              SQLite (WAL Mode)
            </div>
            <div className="text-[11px] text-[#245C38] font-bold mt-1">
              ACID Transactional
            </div>
          </div>
        </div>
      )}

      {/* Override Reasons Breakdown */}
      {metrics && Object.keys(metrics.override_reasons_breakdown || {}).length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-[#CBD5E1] shadow-ocean-sm">
          <h3 className="text-sm font-bold text-[#123B66] mb-3 flex items-center gap-2 font-display">
            <Activity className="w-4 h-4 text-[#299BCB]" />
            <span>Override Reasons Distribution (Operator Feedback)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(metrics.override_reasons_breakdown).map(([reason, count]) => (
              <div
                key={reason}
                className="bg-[#F5F8FC] p-3.5 rounded-xl border border-[#CBD5E1] flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-bold text-[#123B66] capitalize">
                    {reason.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] text-[#64748B]">Documented operator justification</div>
                </div>
                <span className="text-base font-extrabold text-[#299BCB] bg-white px-3 py-1 rounded-lg border border-[#CBD5E1] shadow-ocean-sm">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-[#CBD5E1] shadow-ocean-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#CBD5E1] bg-[#F5F8FC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ClipboardList className="w-5 h-5 text-[#299BCB]" />
            <h3 className="text-sm font-bold text-[#123B66] font-display">
              Audit Event Log
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-[#123B66] bg-white px-3 py-1 rounded-md border border-[#CBD5E1]">
            {events.length} records retrieved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F5F8FC] text-[#123B66] font-bold border-b border-[#CBD5E1]">
              <tr>
                <th className="p-3">Event ID</th>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Field ID</th>
                <th className="p-3">Role</th>
                <th className="p-3">Recommendation</th>
                <th className="p-3">Action Taken</th>
                <th className="p-3">Adherence</th>
                <th className="p-3">Override Reason</th>
                <th className="p-3">Volume (m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
              {events.map((evt) => (
                <tr key={evt.event_id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                  <td className="p-3 font-mono font-bold text-[#299BCB]">{evt.event_id.slice(0, 8)}...</td>
                  <td className="p-3 font-mono text-[#64748B]">{evt.timestamp.replace('T', ' ').slice(0, 19)}</td>
                  <td className="p-3 font-mono font-bold text-[#123B66]">{evt.field_id}</td>
                  <td className="p-3 capitalize">{evt.user_role}</td>
                  <td className="p-3 font-mono text-[#64748B]">{evt.recommended_action}</td>
                  <td className="p-3 font-mono font-bold text-[#0F172A]">{evt.action_taken}</td>
                  <td className="p-3">
                    {evt.followed_recommendation ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#E8F2E5] text-[#245C38] border border-[#78AD76]/40">
                        <CheckCircle2 className="w-3 h-3 text-[#438653]" />
                        Followed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D32F2F]/15 text-[#D32F2F] border border-[#D32F2F]/30">
                        <AlertTriangle className="w-3 h-3 text-[#D32F2F]" />
                        Override
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[#475569] max-w-xs">
                    {evt.override_reason ? (
                      <span className="font-mono text-[11px] bg-[#F5F8FC] px-2 py-0.5 rounded text-[#D32F2F] border border-[#CBD5E1]">
                        {evt.override_reason}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </td>
                  <td className="p-3 font-mono font-semibold">
                    {evt.actual_volume_m3 !== null && evt.actual_volume_m3 !== undefined
                      ? `${evt.actual_volume_m3.toFixed(1)} m³`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {events.length === 0 && (
          <div className="p-12 text-center text-[#64748B] text-xs">
            No action events recorded yet. Click &quot;Log New Action&quot; or log actions from the Field Detail view.
          </div>
        )}
      </div>
    </div>
  );
};
