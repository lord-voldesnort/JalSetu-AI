import React, { useEffect, useState, useCallback } from 'react';
import { api } from '../api/client';
import {
  FieldAssessmentResponse,
  ActionEventRequest,
  ActionEventResponse,
} from '../types/api';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Layers,
  ArrowRight
} from 'lucide-react';

interface FieldDetailModalProps {
  fieldId: string | null;
  scenarioId: string;
  userRole: string;
  isOpen: boolean;
  onClose: () => void;
  onViewForecast: (fieldId: string) => void;
  onActionRecorded?: () => void;
}

export const FieldDetailModal: React.FC<FieldDetailModalProps> = ({
  fieldId,
  scenarioId,
  userRole,
  isOpen,
  onClose,
  onViewForecast,
  onActionRecorded,
}) => {
  const [assessment, setAssessment] = useState<FieldAssessmentResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Action form state
  const [actionTaken, setActionTaken] = useState<string>('irrigate_now');
  const [followedRecommendation, setFollowedRecommendation] = useState<boolean>(true);
  const [overrideReason, setOverrideReason] = useState<string>('pump_failure');
  const [actualVolume, setActualVolume] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);
  const [actionSuccess, setActionSuccess] = useState<ActionEventResponse | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchAssessment = useCallback(async (id: string, scenId: string) => {
    setLoading(true);
    setError(null);
    setActionSuccess(null);
    setActionError(null);
    try {
      const data = await api.getExplain(id, scenId);
      setAssessment(data);
      setActionTaken(data.recommended_action || 'irrigate_now');
      setActualVolume(data.recommended_volume_m3 ? data.recommended_volume_m3.toString() : '');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load field details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen && fieldId) {
      fetchAssessment(fieldId, scenarioId);
    }
  }, [isOpen, fieldId, scenarioId, fetchAssessment]);

  if (!isOpen || !fieldId) return null;

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assessment) return;

    if (!followedRecommendation && !overrideReason) {
      setActionError('An override reason is strictly required when not following recommendation.');
      return;
    }

    setSubmittingAction(true);
    setActionError(null);
    try {
      const payload: ActionEventRequest = {
        field_id: assessment.field_id,
        action_taken: actionTaken,
        followed_recommendation: followedRecommendation,
        override_reason: followedRecommendation ? undefined : overrideReason,
        planned_volume_m3: assessment.recommended_volume_m3,
        actual_volume_m3: actualVolume ? parseFloat(actualVolume) : undefined,
        user_role: userRole,
        notes: notes || undefined,
      };

      const res = await api.recordEvent(payload);
      setActionSuccess(res);
      if (onActionRecorded) onActionRecorded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to record action event';
      setActionError(msg);
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-teal-600 text-white shadow-xs">
              {fieldId}
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                {assessment ? assessment.field_name : `Field ${fieldId}`} — Decision Diagnostics
              </h2>
              <p className="text-xs text-slate-500">
                {assessment ? `${assessment.crop} (${assessment.stage}) • ${assessment.area_acres} acres (${assessment.area_ha} ha)` : 'Loading metadata...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center text-slate-500 text-sm flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Computing deterministic stress signals and multi-source drivers...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to load field assessment</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {assessment && !loading && (
            <>
              {/* Top KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Risk Score */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Risk Score & Level</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-slate-800">
                      {assessment.risk_score.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">/100</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        assessment.risk_level === 'Critical' || assessment.risk_level === 'High'
                          ? 'bg-red-100 text-red-800'
                          : assessment.risk_level === 'Moderate'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {assessment.risk_level}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      ({(assessment.stress_index * 100).toFixed(0)}% Index)
                    </span>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Prescribed Action</div>
                  <div className="mt-1 text-base font-bold text-teal-800 capitalize">
                    {assessment.recommended_action.replace('_', ' ')}
                  </div>
                  <div className="mt-2 text-xs text-slate-600 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{assessment.action_window}</span>
                  </div>
                </div>

                {/* Recommended Volume */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="text-xs text-slate-500 font-medium">Recommended Water</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-teal-700">
                      {assessment.recommended_volume_m3.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-500 font-semibold">m³</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-500">
                    Confidence: {(assessment.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Warnings Banner if any */}
              {assessment.warnings && assessment.warnings.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5 text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Operational Warnings Detected:</span>
                  </div>
                  {assessment.warnings.map((w, idx) => (
                    <p key={idx} className="pl-5 text-amber-800/90 leading-relaxed font-mono text-[11px]">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* 4 Agronomic Signal Drivers Attribution */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Explainable Signal Driver Attribution</span>
                </h3>
                <p className="text-xs text-slate-500 mb-3">
                  Each signal contributes additive points toward the total risk score based on crop stage thresholds.
                </p>

                <div className="space-y-2.5">
                  {assessment.drivers.map((d, idx) => {
                    const isIncreases = d.direction === 'increases_stress';
                    return (
                      <div
                        key={idx}
                        className="bg-slate-50/70 p-3 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-800 uppercase font-mono">
                              {d.signal_name.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                              Observed: {d.observed_value} {d.unit}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 leading-normal">
                            {d.statement}
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold ${
                              isIncreases
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {isIncreases ? '+' : ''}
                            {d.contribution_points.toFixed(1)} pts
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Freshness Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-teal-600" />
                  <span>Data Freshness & Provenance Audit</span>
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">Signal Variable</th>
                        <th className="p-2.5">Data Source</th>
                        <th className="p-2.5">Timestamp</th>
                        <th className="p-2.5">Age</th>
                        <th className="p-2.5">Quality Flag</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {assessment.freshness_table.map((row, idx) => (
                        <tr key={idx} className={row.is_stale ? 'bg-amber-50/50' : 'bg-white'}>
                          <td className="p-2.5 font-mono font-medium">{row.variable}</td>
                          <td className="p-2.5 text-slate-500">{row.source}</td>
                          <td className="p-2.5 text-slate-500">{row.observed_at}</td>
                          <td className="p-2.5">{row.age_days}d ago</td>
                          <td className="p-2.5">
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 font-mono">
                              {row.quality_flag}
                            </span>
                          </td>
                          <td className="p-2.5">
                            {row.is_stale ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                STALE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800">
                                FRESH
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Recording Form */}
              <div className="bg-gradient-to-br from-slate-50 to-teal-50/30 p-4 sm:p-5 rounded-xl border border-teal-200/60">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Record Operator Action & Feedback</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Operator Role: <span className="font-semibold capitalize text-teal-800">{userRole}</span>
                    </p>
                  </div>
                </div>

                {actionSuccess && (
                  <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Action Recorded Successfully!</p>
                      <p className="text-[11px] mt-0.5">
                        Event ID: <span className="font-mono">{actionSuccess.event_id}</span> • Action: {actionSuccess.action_taken} • Followed: {actionSuccess.followed_recommendation ? 'Yes' : 'No (Override)'}
                      </p>
                    </div>
                  </div>
                )}

                {actionError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-300 rounded-lg text-xs text-red-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Failed to record action</p>
                      <p className="text-[11px] mt-0.5">{actionError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleActionSubmit} className="space-y-4">
                  {/* Followed Recommendation Toggle */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Did you follow the AI recommendation ({assessment.recommended_action})?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFollowedRecommendation(true);
                          setActionTaken(assessment.recommended_action);
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          followedRecommendation
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Yes (Followed)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFollowedRecommendation(false);
                          if (actionTaken === assessment.recommended_action) {
                            setActionTaken(assessment.recommended_action === 'irrigate_now' ? 'wait' : 'irrigate_now');
                          }
                        }}
                        className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                          !followedRecommendation
                            ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>No (Overrode)</span>
                      </button>
                    </div>
                  </div>

                  {/* If Overrode: Mandatory Override Reason */}
                  {!followedRecommendation && (
                    <div className="p-3 bg-amber-50/80 rounded-lg border border-amber-300/80 space-y-2">
                      <label className="block text-xs font-bold text-amber-900">
                        Reason for Override (Mandatory) *
                      </label>
                      <select
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        required
                        className="w-full text-xs p-2 rounded-md border border-amber-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                      >
                        <option value="pump_failure">Mechanical pump failure / power outage</option>
                        <option value="canopy_looks_fine">Visual canopy inspection showed no visual stress</option>
                        <option value="rain_expected_by_farmer">Farmer intuition / local rain expected</option>
                        <option value="scheduled_maintenance">Canal or drip line scheduled maintenance</option>
                        <option value="other">Other agronomic / operational reason</option>
                      </select>
                    </div>
                  )}

                  {/* Actual Action Taken & Volume */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Actual Action Taken
                      </label>
                      <select
                        value={actionTaken}
                        onChange={(e) => setActionTaken(e.target.value)}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                      >
                        <option value="irrigate_now">Irrigate Now</option>
                        <option value="wait">Wait / Delay</option>
                        <option value="inspect">Physical Field Inspection</option>
                        <option value="protect_pause">Protect / Pause</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Actual Applied Volume (m³)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={actualVolume}
                        onChange={(e) => setActualVolume(e.target.value)}
                        placeholder="e.g. 15.0"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Field Operator Notes
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional observations or remarks..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white text-slate-800"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submittingAction}
                      className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      {submittingAction ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving event...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Submit Action Event</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Policy Disclaimer */}
              <div className="p-3 bg-slate-100 rounded-lg text-[11px] text-slate-500 flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                <span>{assessment.policy_disclaimer}</span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onClose();
              onViewForecast(fieldId);
            }}
            className="text-teal-700 hover:text-teal-900 font-semibold flex items-center gap-1 transition-colors"
          >
            <span>View 3–7 Day Projections for this Field</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
