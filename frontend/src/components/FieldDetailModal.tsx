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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#123B66]/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFFFF] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-ocean-xl border border-[#CBD5E1] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex items-center justify-between bg-[#F5F8FC]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[#E8F2E5] text-[#245C38] border border-[#78AD76]/50 shadow-crop-sm">
              {fieldId}
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#123B66] font-display">
                {assessment ? assessment.field_name : `Field ${fieldId}`} — Decision Diagnostics
              </h2>
              <p className="text-xs text-[#245C38] font-medium">
                {assessment ? `${assessment.crop} (${assessment.stage}) • ${assessment.area_acres} acres (${assessment.area_ha} ha)` : 'Loading metadata...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-inter font-semibold p-2 rounded-xl text-[#123B66] hover:text-[#299BCB] bg-[#FFFFFF] hover:bg-[#F5F8FC] active:scale-[0.98] border border-[#CBD5E1] hover:border-[#299BCB] shadow-ocean-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center text-[#64748B] text-xs flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#299BCB] border-t-transparent rounded-full animate-spin"></div>
              <span>Computing deterministic stress signals and multi-source drivers...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#D32F2F]/10 border border-[#D32F2F]/30 rounded-xl text-[#D32F2F] text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#D32F2F]" />
              <div>
                <p className="font-bold">Unable to load field assessment</p>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {assessment && !loading && (
            <>
              {/* Top KPI Cards Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Risk Score */}
                <div className="bg-[#F5F8FC] p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] font-medium">Risk Score & Level</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-[#123B66] font-display">
                      {assessment.risk_score.toFixed(1)}
                    </span>
                    <span className="text-xs text-[#64748B] font-mono">/100</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        assessment.risk_level === 'Critical' || assessment.risk_level === 'High'
                          ? 'bg-[#D32F2F]/15 text-[#D32F2F] border border-[#D32F2F]/30'
                          : assessment.risk_level === 'Moderate'
                          ? 'bg-[#D97706]/15 text-[#D97706] border border-[#D97706]/40'
                          : 'bg-[#438653]/15 text-[#245C38] border border-[#438653]/30'
                      }`}
                    >
                      {assessment.risk_level}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      ({(assessment.stress_index * 100).toFixed(0)}% Index)
                    </span>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="bg-[#F5F8FC] p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] font-medium">Prescribed Action</div>
                  <div className="mt-1 text-base font-bold text-[#299BCB] capitalize">
                    {assessment.recommended_action.replace('_', ' ')}
                  </div>
                  <div className="mt-2 text-xs text-[#64748B] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#299BCB]" />
                    <span>{assessment.action_window}</span>
                  </div>
                </div>

                {/* Recommended Volume */}
                <div className="bg-[#F5F8FC] p-4 rounded-xl border border-[#E2E8F0]">
                  <div className="text-xs text-[#64748B] font-medium">Recommended Water</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-[#123B66] font-display">
                      {assessment.recommended_volume_m3.toFixed(1)}
                    </span>
                    <span className="text-xs text-[#299BCB] font-semibold">m³</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#64748B]">
                    Confidence: {(assessment.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Warnings Banner if any */}
              {assessment.warnings && assessment.warnings.length > 0 && (
                <div className="bg-[#D97706]/15 border border-[#D97706]/40 rounded-xl p-3.5 text-xs text-[#92400E] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#123B66]">
                    <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                    <span>Operational Warnings Detected:</span>
                  </div>
                  {assessment.warnings.map((w, idx) => (
                    <p key={idx} className="pl-5 text-[#92400E] leading-relaxed font-mono text-[11px]">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* 4 Agronomic Signal Drivers Attribution */}
              <div>
                <h3 className="text-sm font-bold text-[#123B66] mb-2 flex items-center gap-2 font-display">
                  <Layers className="w-4 h-4 text-[#299BCB]" />
                  <span>Explainable Signal Driver Attribution</span>
                </h3>
                <p className="text-xs text-[#64748B] mb-3">
                  Each signal contributes additive points toward the total risk score based on crop stage thresholds.
                </p>

                <div className="space-y-2.5">
                  {assessment.drivers.map((d, idx) => {
                    const isIncreases = d.direction === 'increases_stress';
                    return (
                      <div
                        key={idx}
                        className="bg-[#F5F8FC] p-3.5 rounded-xl border border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-ocean-sm"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#123B66] uppercase font-mono">
                              {d.signal_name.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] font-mono text-[#334155] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#CBD5E1]">
                              Observed: {d.observed_value} {d.unit}
                            </span>
                          </div>
                          <p className="text-xs text-[#334155] leading-relaxed">
                            {d.statement}
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                              isIncreases
                                ? 'bg-[#D32F2F]/15 text-[#D32F2F] border border-[#D32F2F]/30'
                                : 'bg-[#438653]/15 text-[#245C38] border border-[#438653]/30'
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
                <h3 className="text-sm font-bold text-[#123B66] mb-2 flex items-center gap-2 font-display">
                  <Clock className="w-4 h-4 text-[#299BCB]" />
                  <span>Data Freshness & Provenance Audit</span>
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#E2E8F0] bg-[#FFFFFF]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F5F8FC] text-[#123B66] font-bold border-b border-[#E2E8F0]">
                      <tr>
                        <th className="p-3">Signal Variable</th>
                        <th className="p-3">Data Source</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Age</th>
                        <th className="p-3">Quality Flag</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E2E8F0] text-[#334155]">
                      {assessment.freshness_table.map((row, idx) => (
                        <tr key={idx} className={row.is_stale ? 'bg-[#D32F2F]/5' : 'bg-[#FFFFFF]'}>
                          <td className="p-3 font-mono font-bold text-[#123B66]">{row.variable}</td>
                          <td className="p-3 text-[#64748B]">{row.source}</td>
                          <td className="p-3 text-[#64748B]">{row.observed_at}</td>
                          <td className="p-3 font-semibold">{row.age_days}d ago</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#F5F8FC] border border-[#CBD5E1] font-mono">
                              {row.quality_flag}
                            </span>
                          </td>
                          <td className="p-3">
                            {row.is_stale ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#D32F2F]/15 text-[#D32F2F] border border-[#D32F2F]/40">
                                STALE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#438653]/15 text-[#245C38] border border-[#438653]/30">
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
              <div className="bg-[#F5F8FC] p-4 sm:p-5 rounded-2xl border border-[#CBD5E1]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#123B66] flex items-center gap-2 font-display">
                      <CheckCircle2 className="w-4 h-4 text-[#438653]" />
                      <span>Record Operator Action & Feedback</span>
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Operator Role: <span className="font-bold capitalize text-[#299BCB]">{userRole}</span>
                    </p>
                  </div>
                </div>

                {actionSuccess && (
                  <div className="mb-4 p-3.5 bg-[#438653]/15 border border-[#438653]/40 rounded-xl text-xs text-[#245C38] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#438653] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Action Recorded Successfully!</p>
                      <p className="text-[11px] mt-0.5">
                        Event ID: <span className="font-mono">{actionSuccess.event_id}</span> • Action: {actionSuccess.action_taken} • Followed: {actionSuccess.followed_recommendation ? 'Yes' : 'No (Override)'}
                      </p>
                    </div>
                  </div>
                )}

                {actionError && (
                  <div className="mb-4 p-3.5 bg-[#D32F2F]/15 border border-[#D32F2F]/40 rounded-xl text-xs text-[#D32F2F] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#D32F2F] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Failed to record action</p>
                      <p className="text-[11px] mt-0.5">{actionError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleActionSubmit} className="space-y-4">
                  {/* Followed Recommendation Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-[#123B66] mb-2">
                      Did you follow the AI recommendation ({assessment.recommended_action})?
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFollowedRecommendation(true);
                          setActionTaken(assessment.recommended_action);
                        }}
                        className={`font-inter font-semibold text-[14px] py-2.5 px-4 rounded-xl border transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none focus:ring-2 ${
                          followedRecommendation
                            ? 'bg-[#438653] hover:bg-[#356F43] text-[#FFFFFF] border-transparent shadow-crop-sm focus:ring-[#438653]/40'
                            : 'bg-[#FFFFFF] text-[#123B66] border-[#CBD5E1] hover:bg-[#F5F8FC] hover:text-[#299BCB] focus:ring-[#299BCB]/30'
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
                        className={`font-inter font-semibold text-[14px] py-2.5 px-4 rounded-xl border transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none focus:ring-2 ${
                          !followedRecommendation
                            ? 'bg-[#D32F2F] hover:bg-[#B71C1C] text-[#FFFFFF] border-transparent shadow-ocean-sm focus:ring-[#D32F2F]/40'
                            : 'bg-[#FFFFFF] text-[#123B66] border-[#CBD5E1] hover:bg-[#F5F8FC] hover:text-[#299BCB] focus:ring-[#299BCB]/30'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>No (Overrode)</span>
                      </button>
                    </div>
                  </div>

                  {/* If Overrode: Mandatory Override Reason */}
                  {!followedRecommendation && (
                    <div className="p-3.5 bg-[#FFFFFF] rounded-xl border border-[#D32F2F]/30 space-y-2">
                      <label className="block text-xs font-bold text-[#D32F2F]">
                        Reason for Override (Mandatory) *
                      </label>
                      <select
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 rounded-lg border border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
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
                      <label className="block text-xs font-semibold text-[#123B66] mb-1">
                        Actual Action Taken
                      </label>
                      <select
                        value={actionTaken}
                        onChange={(e) => setActionTaken(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A]"
                      >
                        <option value="irrigate_now">Irrigate Now</option>
                        <option value="wait">Wait / Delay</option>
                        <option value="inspect">Physical Field Inspection</option>
                        <option value="protect_pause">Protect / Pause</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#123B66] mb-1">
                        Actual Applied Volume (m³)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={actualVolume}
                        onChange={(e) => setActualVolume(e.target.value)}
                        placeholder="e.g. 15.0"
                        className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A]"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-[#123B66] mb-1">
                      Field Operator Notes
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional observations or remarks..."
                      className="w-full text-xs p-2.5 rounded-xl border border-[#CBD5E1] bg-[#FFFFFF] text-[#0F172A]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submittingAction}
                      className="font-inter font-semibold text-[14px] px-5 py-2.5 bg-[#299BCB] hover:bg-[#2184AD] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFFFF] rounded-xl shadow-ocean-sm border border-transparent transition-all duration-150 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40"
                    >
                      {submittingAction ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Saving event...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submit Action Event</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Policy Disclaimer */}
              <div className="p-3.5 bg-[#F5F8FC] rounded-xl text-[11px] text-[#64748B] flex items-start gap-2.5 border border-[#E2E8F0]">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#299BCB]" />
                <span>{assessment.policy_disclaimer}</span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E2E8F0] bg-[#F5F8FC] flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onClose();
              onViewForecast(fieldId);
            }}
            className="font-inter font-semibold text-[14px] text-[#299BCB] hover:text-[#2184AD] active:scale-[0.98] inline-flex items-center gap-1.5 transition-all duration-150 focus:outline-none focus:underline"
          >
            <span>View 3–7 Day Projections for this Field</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="font-inter font-semibold text-[14px] px-5 py-2.5 bg-[#FFFFFF] hover:bg-[#F5F8FC] active:scale-[0.98] text-[#123B66] hover:text-[#299BCB] border border-[#CBD5E1] hover:border-[#299BCB] rounded-xl shadow-ocean-sm transition-all duration-150 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
