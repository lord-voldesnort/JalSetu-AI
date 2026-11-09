import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <div className="flex items-center space-x-2 text-slate-600">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            <strong>Planning aid — not an agronomic prescription.</strong> Demonstration fields; labels are proxy-based.
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <span>PCCOE IGC 2026 · Team Byte_Me</span>
          <span>Pimpri-Chinchwad Tomato Pilot</span>
        </div>
      </div>
    </footer>
  );
};

