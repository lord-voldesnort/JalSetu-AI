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
  PlusCircle
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
      // Refresh list and metrics
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
      {/* Header and Refresh Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <h2 className="text-base font-bold text-slate-800">
              Audit Trail, Operator Feedback & System Telemetry
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Immutable log of operator actions, decision compliance rates, and mandatory override reason attribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLogForm(!showLogForm)}
            className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{showLogForm ? 'Hide Quick Logger' : 'Log New Action'}</span>
          </button>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors border border-slate-300"
            title="Refresh events & metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
          <div>
            <p className="font-semibold">Unable to load audit history</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Quick Action Logger Form (Collapsible) */}
      {showLogForm && (
        <div className="bg-white rounded-2xl p-5 border border-teal-200 shadow-sm animate-in fade-in duration-150">
          <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-teal-600" />
            <span>Quick Operator Action Event Recorder</span>
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Record a field action taken by <span className="font-semibold text-teal-800 capitalize">{userRole}</span>.
          </p>

          {formSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>{formError}</span>
            </div>
          )}

          <form onSubmit={handleQuickSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Field
                </label>
                <select
                  value={targetFieldId}
                  onChange={(e) => setTargetFieldId(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  {fields?.features?.map((f) => (
                    <option key={f.properties.id} value={f.properties.id}>
                      {f.properties.id} — {f.properties.name} ({f.properties.crop})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Action Taken
                </label>
                <select
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="irrigate_now">Irrigate Now</option>
                  <option value="wait">Wait / Delay</option>
                  <option value="inspect">Inspect Field</option>
                  <option value="protect_pause">Protect / Pause</option>
                  <option value="other">Other Action</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Applied Volume (m³)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={actualVolume}
                  onChange={(e) => setActualVolume(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                  placeholder="e.g. 15.0"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Followed JalSetu AI Recommendation?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFollowed(true)}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      followed
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Yes (Complied)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFollowed(false)}
                    className={`py-2 text-xs font-semibold rounded-lg border ${
                      !followed
                        ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    No (Override)
                  </button>
                </div>
              </div>

              {!followed && (
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">
                    Override Reason *
                  </label>
                  <select
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-amber-300 bg-amber-50/50 text-slate-800"
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
                className="flex-1 text-xs p-2 rounded-lg border border-slate-300 bg-white"
              />
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
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
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Events Logged</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">
              {metrics.total_events_logged}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Total operational records</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Operator Adherence</div>
            <div className="text-2xl font-bold text-emerald-600 mt-1">
              {metrics.adherence_rate_pct.toFixed(0)}%
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Compliance with AI prescriptives</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Overrides Logged</div>
            <div className="text-2xl font-bold text-amber-600 mt-1">
              {metrics.overrides_logged}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Human-in-the-loop overrides</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs text-slate-500 font-medium">Audit Database</div>
            <div className="text-sm font-mono font-bold text-slate-700 mt-2">
              SQLite (WAL Mode)
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold mt-1">
              ACID Transactional
            </div>
          </div>
        </div>
      )}

      {/* Override Reasons Breakdown */}
      {metrics && Object.keys(metrics.override_reasons_breakdown || {}).length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-600" />
            <span>Override Reasons Distribution (Operator Feedback)</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {Object.entries(metrics.override_reasons_breakdown).map(([reason, count]) => (
              <div
                key={reason}
                className="bg-amber-50/60 p-3 rounded-xl border border-amber-200 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-800 capitalize">
                    {reason.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] text-slate-500">Documented operator justification</div>
                </div>
                <span className="text-base font-extrabold text-amber-900 bg-white px-2.5 py-1 rounded-md border border-amber-200">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-800">
              Audit Event Log
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {events.length} records retrieved
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
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
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {events.map((evt) => (
                <tr key={evt.event_id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-mono font-bold text-teal-700">{evt.event_id}</td>
                  <td className="p-3 font-mono text-slate-500">{evt.timestamp}</td>
                  <td className="p-3 font-mono font-semibold text-slate-800">{evt.field_id}</td>
                  <td className="p-3 capitalize">{evt.user_role}</td>
                  <td className="p-3 font-mono text-slate-600">{evt.recommended_action}</td>
                  <td className="p-3 font-mono font-bold text-slate-800">{evt.action_taken}</td>
                  <td className="p-3">
                    {evt.followed_recommendation ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Followed
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        Override
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600 max-w-xs">
                    {evt.override_reason ? (
                      <span className="font-mono text-[11px] bg-slate-100 px-1.5 py-0.5 rounded text-amber-900 border border-slate-200">
                        {evt.override_reason}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="p-3 font-mono">
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
          <div className="p-12 text-center text-slate-500 text-xs">
            No action events recorded yet. Click &quot;Log New Action&quot; or log actions from the Field Detail view.
          </div>
        )}
      </div>
    </div>
  );
};
