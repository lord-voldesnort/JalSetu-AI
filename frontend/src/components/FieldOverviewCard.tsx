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
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center text-teal-700">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800 text-sm sm:text-base">Integrated Field Registry</h3>
            <p className="text-xs text-slate-500">Pimpri-Chinchwad Peri-Urban Demonstration Cluster</p>
          </div>
        </div>

        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200">
          {loading ? 'Loading...' : `${fields.length} Fields Loaded`}
        </span>
      </div>

      <div className="mt-4">
        {loading ? (
          <div className="py-8 text-center text-slate-400 text-sm">
            <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            Loading demonstration fields from API...
          </div>
        ) : error ? (
          <div className="py-4 text-center text-slate-400 text-sm">
            <p className="text-rose-600 font-medium">Could not retrieve fields</p>
            <p className="text-xs text-slate-400 mt-1">{error}</p>
          </div>
        ) : fields.length === 0 ? (
          <p className="text-sm text-slate-500 py-4 text-center">No fields loaded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100 text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Field ID</th>
                  <th className="py-2.5 px-3">Name</th>
                  <th className="py-2.5 px-3">Crop</th>
                  <th className="py-2.5 px-3">Growth Stage</th>
                  <th className="py-2.5 px-3 text-right">Area (Acres)</th>
                  <th className="py-2.5 px-3 text-right">Area (Ha)</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-slate-700">
                {fields.map((f) => (
                  <tr key={f.properties.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-3 font-semibold text-teal-800">{f.properties.id}</td>
                    <td className="py-2 px-3 font-sans font-medium text-slate-800">{f.properties.name}</td>
                    <td className="py-2 px-3 font-sans capitalize flex items-center gap-1.5 text-slate-600">
                      <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                      {f.properties.crop}
                    </td>
                    <td className="py-2 px-3 font-sans capitalize text-slate-500">{f.properties.stage}</td>
                    <td className="py-2 px-3 text-right font-medium">{f.properties.area_acres} ac</td>
                    <td className="py-2 px-3 text-right text-slate-400">{f.properties.area_ha || '-'} ha</td>
                    <td className="py-2 px-3 text-center">
                      <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100"></span>
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

