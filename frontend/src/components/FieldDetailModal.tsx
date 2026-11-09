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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#382A25]/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-[#FFFCF6] rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-warm-xl border border-[#E8D6C5] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#E8D6C5] flex items-center justify-between bg-[#F2E1D4]/40">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-[#C96D3B] text-[#FFFCF6] shadow-warm-sm">
              {fieldId}
            </span>
            <div>
              <h2 className="text-lg font-bold text-[#382A25] font-display">
                {assessment ? assessment.field_name : `Field ${fieldId}`} — Decision Diagnostics
              </h2>
              <p className="text-xs text-[#817064]">
                {assessment ? `${assessment.crop} (${assessment.stage}) • ${assessment.area_acres} acres (${assessment.area_ha} ha)` : 'Loading metadata...'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="font-inter font-semibold p-2 rounded-xl text-[#69483A] hover:text-[#382A25] bg-[#FFFCF6] hover:bg-[#FAF5ED] active:scale-[0.98] border border-[#E8D6C5] hover:border-[#D99A91] shadow-warm-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center text-[#817064] text-xs flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-3 border-[#C96D3B] border-t-transparent rounded-full animate-spin"></div>
              <span>Computing deterministic stress signals and multi-source drivers...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-[#B95B55]/10 border border-[#B95B55]/30 rounded-xl text-[#8A3C37] text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-[#B95B55]" />
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
                <div className="bg-[#FAF5ED] p-4 rounded-xl border border-[#E8D6C5]">
                  <div className="text-xs text-[#817064] font-medium">Risk Score & Level</div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-extrabold text-[#382A25] font-display">
                      {assessment.risk_score.toFixed(1)}
                    </span>
                    <span className="text-xs text-[#9D8D82] font-mono">/100</span>
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                        assessment.risk_level === 'Critical' || assessment.risk_level === 'High'
                          ? 'bg-[#B95B55]/15 text-[#8A3C37] border border-[#B95B55]/30'
                          : assessment.risk_level === 'Moderate'
                          ? 'bg-[#E5B94B]/20 text-[#69483A] border border-[#E5B94B]/40'
                          : 'bg-[#85845A]/15 text-[#585736] border border-[#85845A]/30'
                      }`}
                    >
                      {assessment.risk_level}
                    </span>
                    <span className="text-[11px] text-[#817064]">
                      ({(assessment.stress_index * 100).toFixed(0)}% Index)
                    </span>
                  </div>
                </div>

                {/* Recommended Action */}
                <div className="bg-[#FAF5ED] p-4 rounded-xl border border-[#E8D6C5]">
                  <div className="text-xs text-[#817064] font-medium">Prescribed Action</div>
                  <div className="mt-1 text-base font-bold text-[#C96D3B] capitalize">
                    {assessment.recommended_action.replace('_', ' ')}
                  </div>
                  <div className="mt-2 text-xs text-[#817064] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#C96D3B]" />
                    <span>{assessment.action_window}</span>
                  </div>
                </div>

                {/* Recommended Volume */}
                <div className="bg-[#FAF5ED] p-4 rounded-xl border border-[#E8D6C5]">
                  <div className="text-xs text-[#817064] font-medium">Recommended Water</div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-3xl font-extrabold text-[#B95B55] font-display">
                      {assessment.recommended_volume_m3.toFixed(1)}
                    </span>
                    <span className="text-xs text-[#69483A] font-semibold">m³</span>
                  </div>
                  <div className="mt-2 text-[11px] text-[#817064]">
                    Confidence: {(assessment.confidence * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Warnings Banner if any */}
              {assessment.warnings && assessment.warnings.length > 0 && (
                <div className="bg-[#E5B94B]/15 border border-[#E5B94B]/40 rounded-xl p-3.5 text-xs text-[#69483A] space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-[#382A25]">
                    <AlertTriangle className="w-4 h-4 text-[#C96D3B]" />
                    <span>Operational Warnings Detected:</span>
                  </div>
                  {assessment.warnings.map((w, idx) => (
                    <p key={idx} className="pl-5 text-[#69483A] leading-relaxed font-mono text-[11px]">
                      • {w}
                    </p>
                  ))}
                </div>
              )}

              {/* 4 Agronomic Signal Drivers Attribution */}
              <div>
                <h3 className="text-sm font-bold text-[#382A25] mb-2 flex items-center gap-2 font-display">
                  <Layers className="w-4 h-4 text-[#C96D3B]" />
                  <span>Explainable Signal Driver Attribution</span>
                </h3>
                <p className="text-xs text-[#817064] mb-3">
                  Each signal contributes additive points toward the total risk score based on crop stage thresholds.
                </p>

                <div className="space-y-2.5">
                  {assessment.drivers.map((d, idx) => {
                    const isIncreases = d.direction === 'increases_stress';
                    return (
                      <div
                        key={idx}
                        className="bg-[#FAF5ED] p-3.5 rounded-xl border border-[#E8D6C5] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-warm-sm"
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#382A25] uppercase font-mono">
                              {d.signal_name.replace('_', ' ')}
                            </span>
                            <span className="text-[11px] font-mono text-[#817064] bg-[#FFFCF6] px-2 py-0.5 rounded border border-[#E8D6C5]">
                              Observed: {d.observed_value} {d.unit}
                            </span>
                          </div>
                          <p className="text-xs text-[#69483A] leading-relaxed">
                            {d.statement}
                          </p>
                        </div>

                        <div className="sm:text-right shrink-0">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold ${
                              isIncreases
                                ? 'bg-[#B95B55]/15 text-[#8A3C37] border border-[#B95B55]/30'
                                : 'bg-[#85845A]/15 text-[#585736] border border-[#85845A]/30'
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
                <h3 className="text-sm font-bold text-[#382A25] mb-2 flex items-center gap-2 font-display">
                  <Clock className="w-4 h-4 text-[#C96D3B]" />
                  <span>Data Freshness & Provenance Audit</span>
                </h3>
                <div className="overflow-x-auto rounded-xl border border-[#E8D6C5] bg-[#FFFCF6]">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF5ED] text-[#382A25] font-bold border-b border-[#E8D6C5]">
                      <tr>
                        <th className="p-3">Signal Variable</th>
                        <th className="p-3">Data Source</th>
                        <th className="p-3">Timestamp</th>
                        <th className="p-3">Age</th>
                        <th className="p-3">Quality Flag</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8D6C5]/60 text-[#69483A]">
                      {assessment.freshness_table.map((row, idx) => (
                        <tr key={idx} className={row.is_stale ? 'bg-[#F2E1D4]/40' : 'bg-[#FFFCF6]'}>
                          <td className="p-3 font-mono font-bold text-[#382A25]">{row.variable}</td>
                          <td className="p-3 text-[#817064]">{row.source}</td>
                          <td className="p-3 text-[#817064]">{row.observed_at}</td>
                          <td className="p-3 font-semibold">{row.age_days}d ago</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-[#FAF5ED] border border-[#E8D6C5] font-mono">
                              {row.quality_flag}
                            </span>
                          </td>
                          <td className="p-3">
                            {row.is_stale ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#B95B55]/15 text-[#8A3C37] border border-[#B95B55]/40">
                                STALE
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#85845A]/15 text-[#585736] border border-[#85845A]/30">
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
              <div className="bg-[#F2E1D4]/30 p-4 sm:p-5 rounded-2xl border border-[#E8D6C5]">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#382A25] flex items-center gap-2 font-display">
                      <CheckCircle2 className="w-4 h-4 text-[#85845A]" />
                      <span>Record Operator Action & Feedback</span>
                    </h3>
                    <p className="text-xs text-[#817064]">
                      Operator Role: <span className="font-bold capitalize text-[#C96D3B]">{userRole}</span>
                    </p>
                  </div>
                </div>

                {actionSuccess && (
                  <div className="mb-4 p-3.5 bg-[#85845A]/15 border border-[#85845A]/40 rounded-xl text-xs text-[#585736] flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-[#85845A] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Action Recorded Successfully!</p>
                      <p className="text-[11px] mt-0.5">
                        Event ID: <span className="font-mono">{actionSuccess.event_id}</span> • Action: {actionSuccess.action_taken} • Followed: {actionSuccess.followed_recommendation ? 'Yes' : 'No (Override)'}
                      </p>
                    </div>
                  </div>
                )}

                {actionError && (
                  <div className="mb-4 p-3.5 bg-[#B95B55]/15 border border-[#B95B55]/40 rounded-xl text-xs text-[#8A3C37] flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-[#B95B55] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Failed to record action</p>
                      <p className="text-[11px] mt-0.5">{actionError}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleActionSubmit} className="space-y-4">
                  {/* Followed Recommendation Toggle */}
                  <div>
                    <label className="block text-xs font-bold text-[#382A25] mb-2">
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
                            ? 'bg-[#C96D3B] hover:bg-[#B35E30] text-[#FFFCF6] border-transparent shadow-warm-sm focus:ring-[#C96D3B]/40'
                            : 'bg-[#FFFCF6] text-[#69483A] border-[#E8D6C5] hover:bg-[#FAF5ED] hover:text-[#382A25] focus:ring-[#C96D3B]/30'
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
                            ? 'bg-[#B95B55] hover:bg-[#A34E48] text-[#FFFCF6] border-transparent shadow-warm-sm focus:ring-[#B95B55]/40'
                            : 'bg-[#FFFCF6] text-[#69483A] border-[#E8D6C5] hover:bg-[#FAF5ED] hover:text-[#382A25] focus:ring-[#C96D3B]/30'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>No (Overrode)</span>
                      </button>
                    </div>
                  </div>

                  {/* If Overrode: Mandatory Override Reason */}
                  {!followedRecommendation && (
                    <div className="p-3.5 bg-[#FAF5ED] rounded-xl border border-[#B95B55]/30 space-y-2">
                      <label className="block text-xs font-bold text-[#8A3C37]">
                        Reason for Override (Mandatory) *
                      </label>
                      <select
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        required
                        className="w-full text-xs p-2.5 rounded-lg border border-[#E8D6C5] bg-[#FFFCF6] text-[#2C201C] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
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
                      <label className="block text-xs font-semibold text-[#382A25] mb-1">
                        Actual Action Taken
                      </label>
                      <select
                        value={actionTaken}
                        onChange={(e) => setActionTaken(e.target.value)}
                        className="w-full text-xs p-2.5 rounded-xl border border-[#E8D6C5] bg-[#FFFCF6] text-[#2C201C]"
                      >
                        <option value="irrigate_now">Irrigate Now</option>
                        <option value="wait">Wait / Delay</option>
                        <option value="inspect">Physical Field Inspection</option>
                        <option value="protect_pause">Protect / Pause</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#382A25] mb-1">
                        Actual Applied Volume (m³)
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        value={actualVolume}
                        onChange={(e) => setActualVolume(e.target.value)}
                        placeholder="e.g. 15.0"
                        className="w-full text-xs p-2.5 rounded-xl border border-[#E8D6C5] bg-[#FFFCF6] text-[#2C201C]"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-[#382A25] mb-1">
                      Field Operator Notes
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Optional observations or remarks..."
                      className="w-full text-xs p-2.5 rounded-xl border border-[#E8D6C5] bg-[#FFFCF6] text-[#2C201C]"
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="submit"
                      disabled={submittingAction}
                      className="font-inter font-semibold text-[14px] px-5 py-2.5 bg-[#C96D3B] hover:bg-[#B35E30] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-[#FFFCF6] rounded-xl shadow-warm-sm border border-transparent transition-all duration-150 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40"
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
              <div className="p-3.5 bg-[#FAF5ED] rounded-xl text-[11px] text-[#817064] flex items-start gap-2.5 border border-[#E8D6C5]">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#C96D3B]" />
                <span>{assessment.policy_disclaimer}</span>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#E8D6C5] bg-[#FAF5ED] flex items-center justify-between text-xs">
          <button
            onClick={() => {
              onClose();
              onViewForecast(fieldId);
            }}
            className="font-inter font-semibold text-[14px] text-[#C96D3B] hover:text-[#B35E30] active:scale-[0.98] inline-flex items-center gap-1.5 transition-all duration-150 focus:outline-none focus:underline"
          >
            <span>View 3–7 Day Projections for this Field</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onClose}
            className="font-inter font-semibold text-[14px] px-5 py-2.5 bg-[#FFFCF6] hover:bg-[#FAF5ED] active:scale-[0.98] text-[#69483A] hover:text-[#382A25] border border-[#E8D6C5] hover:border-[#D99A91] rounded-xl shadow-warm-sm transition-all duration-150 inline-flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
