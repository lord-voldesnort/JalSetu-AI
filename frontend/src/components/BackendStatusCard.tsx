import React from 'react';
import { CheckCircle2, XCircle, RefreshCw, Server, Database } from 'lucide-react';
import { HealthResponse } from '../types/api';

interface Props {
  health: HealthResponse | null;
  loading: boolean;
  error: string | null;
  onRefresh: () => void;
  apiUrl: string;
}

export const BackendStatusCard: React.FC<Props> = ({
  health,
  loading,
  error,
  onRefresh,
  apiUrl
}) => {
  const isHealthy = health?.status === 'ok';

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-ocean-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#CBD5E1]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#299BCB]/10 flex items-center justify-center text-[#299BCB]">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#123B66] text-sm sm:text-base">Backend Connection Status</h3>
            <p className="text-xs text-[#64748B] font-mono">{apiUrl}</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="font-inter font-semibold text-[14px] px-4 py-2 bg-white hover:bg-[#F8FAFC] active:scale-[0.98] text-[#123B66] border border-[#CBD5E1] hover:border-[#299BCB] rounded-xl shadow-ocean-sm transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#299BCB]/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#299BCB]' : ''}`} />
          <span>{loading ? 'Checking...' : 'Check Health'}</span>
        </button>
      </div>

      <div className="mt-4">
        {loading && !health ? (
          <div className="flex items-center space-x-3 py-3 text-[#64748B] text-sm">
            <div className="w-4 h-4 border-2 border-[#299BCB] border-t-transparent rounded-full animate-spin"></div>
            <span>Contacting backend health endpoint at <code className="text-xs bg-[#F5F8FC] px-1 py-0.5 rounded text-[#123B66]">{apiUrl}/health</code>...</span>
          </div>
        ) : isHealthy ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-[#245C38] bg-[#E8F2E5] px-3 py-2 rounded-xl text-sm border border-[#78AD76]/40">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-[#438653]" />
              <span className="font-medium">Backend is online and operational</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-[#F5F8FC] p-2.5 rounded-xl border border-[#CBD5E1]">
                <span className="text-[#64748B] block mb-0.5">Application</span>
                <span className="font-semibold text-[#123B66]">{health?.app}</span>
              </div>
              <div className="bg-[#F5F8FC] p-2.5 rounded-xl border border-[#CBD5E1]">
                <span className="text-[#64748B] block mb-0.5">API Version</span>
                <span className="font-semibold text-[#123B66]">{health?.version}</span>
              </div>
              <div className="bg-[#F5F8FC] p-2.5 rounded-xl border border-[#CBD5E1]">
                <span className="text-[#64748B] block mb-0.5">Environment</span>
                <span className="font-semibold text-[#123B66]">{health?.environment}</span>
              </div>
              <div className="bg-[#F5F8FC] p-2.5 rounded-xl border border-[#CBD5E1]">
                <span className="text-[#64748B] block mb-0.5 flex items-center gap-1">
                  <Database className="w-3 h-3 text-[#64748B]" /> Database
                </span>
                <span className="font-semibold text-[#438653]">{health?.database}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start space-x-2 text-[#D32F2F] bg-[#D32F2F]/10 px-3 py-2.5 rounded-xl text-sm border border-[#D32F2F]/30">
              <XCircle className="w-5 h-5 shrink-0 text-[#D32F2F] mt-0.5" />
              <div>
                <p className="font-semibold">Unable to connect to backend</p>
                <p className="text-xs text-[#D32F2F] mt-0.5">{error || 'Server did not respond to /health'}</p>
              </div>
            </div>
            <p className="text-xs text-[#64748B]">
              Make sure the FastAPI server is running on <code className="bg-[#F5F8FC] px-1 py-0.5 rounded text-[#123B66]">{apiUrl}</code> using command <code className="bg-[#F5F8FC] px-1 py-0.5 rounded text-[#123B66]">python -m uvicorn app.main:app --port 8000</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
