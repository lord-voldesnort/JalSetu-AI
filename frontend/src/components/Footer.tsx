import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-[#CBD5E1] py-5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#64748B] gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-[#299BCB]/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-[#299BCB]" />
          </div>
          <span>
            <strong className="text-[#0F172A]">Planning aid — not an agronomic prescription.</strong> Demonstration fields in Pune peri-urban cluster; labels are proxy-based.
          </span>
        </div>
        <div className="flex items-center space-x-4 text-[11px] text-[#94A3B8]">
          <span>PCCOE Indradhanu IGC 2026</span>
          <span className="w-1 h-1 rounded-full bg-[#CBD5E1]"></span>
          <span>Team Byte_Me</span>
          <span className="w-1 h-1 rounded-full bg-[#CBD5E1]"></span>
          <span className="font-semibold text-[#123B66]">Pimpri-Chinchwad Cluster</span>
        </div>
      </div>
    </footer>
  );
};
