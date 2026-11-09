import React from 'react';
import { AlertCircle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#FFFCF6] border-t border-[#E8D6C5] py-5 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between text-xs text-[#817064] gap-3">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 rounded-full bg-[#C96D3B]/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-3.5 h-3.5 text-[#C96D3B]" />
          </div>
          <span>
            <strong className="text-[#382A25]">Planning aid — not an agronomic prescription.</strong> Demonstration fields in Pune peri-urban cluster; labels are proxy-based.
          </span>
        </div>
        <div className="flex items-center space-x-4 text-[11px] text-[#9D8D82]">
          <span>PCCOE Indradhanu IGC 2026</span>
          <span className="w-1 h-1 rounded-full bg-[#E8D6C5]"></span>
          <span>Team Byte_Me</span>
          <span className="w-1 h-1 rounded-full bg-[#E8D6C5]"></span>
          <span className="font-medium text-[#69483A]">Pimpri-Chinchwad Cluster</span>
        </div>
      </div>
    </footer>
  );
};
