import React from 'react';
import { MapPin, Sprout } from 'lucide-react';
import { FieldFeatureCollection } from '../types/api';

interface Props {
  fieldsData: FieldFeatureCollection | null;
  loading: boolean;
  error: string | null;
}

export const FieldOverviewCard: React.FC<Props> = ({ fieldsData, loading, error }) => {
  const fields = fieldsData?.features || [];

  return (
    <div className="bg-white rounded-2xl border border-[#CBD5E1] p-6 shadow-ocean-sm">
      <div className="flex items-center justify-between pb-4 border-b border-[#CBD5E1]">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-[#E8F2E5] flex items-center justify-center text-[#245C38]">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-[#123B66] text-sm sm:text-base font-display">Integrated Field Registry</h3>
            <p className="text-xs text-[#64748B]">Pimpri-Chinchwad Peri-Urban Demonstration Cluster</p>
          </div>
        </div>

        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#E8F2E5] text-[#245C38] border border-[#78AD76]/40">
          {loading ? 'Loading...' : `${fields.length} Fields Loaded`}
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-[#64748B] text-sm">
            <div className="w-5 h-5 border-2 border-[#299BCB] border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading demonstration fields from API...
          </div>
        ) : error ? (
          <div className="py-4 text-center text-[#64748B] text-sm">
            <p className="text-[#D32F2F] font-medium">Could not retrieve fields</p>
            <p className="text-xs text-[#64748B] mt-1">{error}</p>
          </div>
        ) : fields.length === 0 ? (
          <p className="text-sm text-[#64748B] py-4 text-center">No fields loaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#E2E8F0] text-left text-xs">
              <thead>
                <tr className="bg-[#F5F8FC] text-[#123B66] font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Field ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Crop</th>
                  <th className="py-2.5 px-3">Growth Stage</th>
                  <th className="py-2.5 px-3 text-right">Area (Acres)</th>
                  <th className="py-2.5 px-3 text-right">Area (Ha)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] font-mono text-[#334155]">
                {fields.map((f) => (
                  <tr key={f.properties.id} className="hover:bg-[#F8FAFC] transition">
                    <td className="py-2 px-3 font-semibold text-[#123B66]">{f.properties.id}</td>
                    <td className="py-2 px-3 font-sans font-medium text-[#0F172A]">{f.properties.name}</td>
                    <td className="py-2 px-3 font-sans capitalize flex items-center gap-1.5 text-[#245C38]">
                      <Sprout className="w-3.5 h-3.5 text-[#438653]" />
                      {f.properties.crop}
                    </td>
                    <td className="py-2 px-3 font-sans capitalize text-[#64748B]">{f.properties.stage}</td>
                    <td className="py-2 px-3 text-right font-medium">{f.properties.area_acres} ac</td>
                    <td className="py-2 px-3 text-right text-[#94A3B8]">{f.properties.area_ha || '-'} ha</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#438653] ring-2 ring-[#E8F2E5]"></span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
