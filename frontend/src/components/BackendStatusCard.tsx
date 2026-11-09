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
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Backend Connection Status</h3>
            <p className="text-xs text-slate-500 font-mono">{apiUrl}</p>
          </div>
        </div>

        <button
          onClick={onRefresh}
          disabled={loading}
          className="font-inter font-semibold text-[14px] px-4 py-2 bg-[#FFFCF6] hover:bg-[#FAF5ED] active:scale-[0.98] text-[#69483A] hover:text-[#382A25] border border-[#E8D6C5] hover:border-[#D99A91] rounded-xl shadow-warm-sm transition-all duration-150 inline-flex items-center justify-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/30 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C96D3B]' : ''}`} />
          <span>{loading ? 'Checking...' : 'Check Health'}</span>
        </button>
      </div>

      <div className="mt-4">
        {loading && !health ? (
          <div className="flex items-center space-x-3 py-3 text-slate-500 text-sm">
            <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
            <span>Contacting backend health endpoint at <code className="text-xs bg-slate-100 px-1 py-0.5 rounded">{apiUrl}/health</code>...</span>
          </div>
        ) : isHealthy ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg text-sm border border-emerald-200">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <span className="font-medium">Backend is online and operational</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Application</span>
                <span className="font-semibold text-slate-700">{health?.app}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">API Version</span>
                <span className="font-semibold text-slate-700">{health?.version}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5">Environment</span>
                <span className="font-semibold text-slate-700">{health?.environment}</span>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                <span className="text-slate-400 block mb-0.5 flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-500" /> Database
                </span>
                <span className="font-semibold text-emerald-600">{health?.database}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start space-x-2 text-rose-700 bg-rose-50 px-3 py-2.5 rounded-lg text-sm border border-rose-200">
              <XCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold">Unable to connect to backend</p>
                <p className="text-xs text-rose-600 mt-0.5">{error || 'Server did not respond to /health'}</p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Make sure the FastAPI server is running on <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{apiUrl}</code> using command <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">python -m uvicorn app.main:app --port 8000</code>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

