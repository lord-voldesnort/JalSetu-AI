import React, { useMemo, useState } from 'react';
import { FieldFeatureCollection } from '../types/api';
import { MapPin, Info, Layers, Eye } from 'lucide-react';

interface FieldMapProps {
  fields: FieldFeatureCollection | null;
  selectedFieldId: string | null;
  onSelectField: (fieldId: string) => void;
  loading?: boolean;
}

export const FieldMap: React.FC<FieldMapProps> = ({
  fields,
  selectedFieldId,
  onSelectField,
  loading = false,
}) => {
  const [hoveredFieldId, setHoveredFieldId] = useState<string | null>(null);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // SVG viewBox settings
  const viewBoxWidth = 800;
  const viewBoxHeight = 460;
  const padding = 50;

  // Compute bounding box from GeoJSON features
  const bounds = useMemo(() => {
    if (!fields || !fields.features || fields.features.length === 0) {
      return { minX: 73.78, maxX: 73.786, minY: 18.66, maxY: 18.6625 };
    }
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    fields.features.forEach((feat) => {
      const coords = feat.geometry?.coordinates?.[0] || [];
      coords.forEach(([lng, lat]) => {
        if (lng < minX) minX = lng;
        if (lng > maxX) maxX = lng;
        if (lat < minY) minY = lat;
        if (lat > maxY) maxY = lat;
      });
    });

    // Add 5% margin to prevent touching the edges
    const spanX = maxX - minX || 0.005;
    const spanY = maxY - minY || 0.002;
    return {
      minX: minX - spanX * 0.05,
      maxX: maxX + spanX * 0.05,
      minY: minY - spanY * 0.05,
      maxY: maxY + spanY * 0.05,
    };
  }, [fields]);

  // Project longitude/latitude to SVG x,y coordinates
  const project = useMemo(() => {
    return (lng: number, lat: number) => {
      const { minX, maxX, minY, maxY } = bounds;
      const x = padding + ((lng - minX) / (maxX - minX)) * (viewBoxWidth - 2 * padding);
      // SVG y goes down; latitude increases up (north)
      const y = padding + ((maxY - lat) / (maxY - minY)) * (viewBoxHeight - 2 * padding);
      return { x, y };
    };
  }, [bounds, viewBoxWidth, viewBoxHeight, padding]);

  // Status-based color configuration
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'red':
        return {
          fill: '#EF4444',
          fillOpacity: 0.55,
          stroke: '#B91C1C',
          badgeBg: 'bg-red-100 text-red-800 border-red-300',
          label: 'High / Critical Stress',
        };
      case 'amber':
        return {
          fill: '#F59E0B',
          fillOpacity: 0.55,
          stroke: '#D97706',
          badgeBg: 'bg-amber-100 text-amber-800 border-amber-300',
          label: 'Moderate Stress',
        };
      case 'blue':
        return {
          fill: '#3B82F6',
          fillOpacity: 0.55,
          stroke: '#1D4ED8',
          badgeBg: 'bg-blue-100 text-blue-800 border-blue-300',
          label: 'Paused (Deluge / Protect)',
        };
      case 'green':
      default:
        return {
          fill: '#10B981',
          fillOpacity: 0.55,
          stroke: '#047857',
          badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-300',
          label: 'Low Stress / Normal',
        };
    }
  };

  // Compute status summary counts
  const statusCounts = useMemo(() => {
    const counts = { green: 0, amber: 0, red: 0, blue: 0 };
    if (!fields?.features) return counts;
    fields.features.forEach((feat) => {
      const s = (feat.properties.stress_status || 'green') as keyof typeof counts;
      if (counts[s] !== undefined) counts[s]++;
      else counts.green++;
    });
    return counts;
  }, [fields]);

  const hoveredFeature = useMemo(() => {
    if (!hoveredFieldId || !fields?.features) return null;
    return fields.features.find((f) => f.properties.id === hoveredFieldId) || null;
  }, [hoveredFieldId, fields]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Map Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-800">
              Interactive Field Spatial Map
            </h2>
            <p className="text-xs text-slate-500">
              Pimpri-Chinchwad Peri-Urban Demonstration Cluster • 10 Monitored Polygons
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              showLabels
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
            }`}
            title="Toggle field ID labels"
          >
            <Eye className="w-3.5 h-3.5" />
            {showLabels ? 'Labels Visible' : 'Labels Hidden'}
          </button>
        </div>
      </div>

      {/* Map Canvas / SVG Container */}
      <div className="relative w-full bg-gradient-to-b from-slate-100/70 to-slate-200/50 p-2 sm:p-4">
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
              <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin"></div>
              <span>Updating spatial polygons...</span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto max-h-[500px] select-none rounded-xl bg-emerald-950/[0.04] border border-slate-200/80 shadow-inner"
        >
          {/* Subtle agricultural grid pattern */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#CBD5E1" strokeWidth="0.5" strokeOpacity="0.4" />
            </pattern>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#0F766E" floodOpacity="0.8" />
            </filter>
          </defs>
          <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#grid)" />

          {/* Demonstration Canal / Road Reference Line */}
          <path
            d={`M 30 ${viewBoxHeight * 0.88} Q ${viewBoxWidth * 0.4} ${viewBoxHeight * 0.82} ${viewBoxWidth - 30} ${viewBoxHeight * 0.92}`}
            fill="none"
            stroke="#94A3B8"
            strokeWidth="3"
            strokeDasharray="6 4"
            strokeOpacity="0.6"
          />
          <text
            x={viewBoxWidth - 140}
            y={viewBoxHeight * 0.95}
            fill="#64748B"
            fontSize="10"
            fontFamily="sans-serif"
            fontStyle="italic"
          >
            Pavana Irrigation Canal Corridor
          </text>

          {/* Render Field Polygons */}
          {fields?.features?.map((feat) => {
            const fid = feat.properties.id;
            const isSelected = selectedFieldId === fid;
            const isHovered = hoveredFieldId === fid;
            const style = getStatusStyle(feat.properties.stress_status);

            const coords = feat.geometry?.coordinates?.[0] || [];
            if (coords.length === 0) return null;

            // Generate SVG path string
            const points = coords.map(([lng, lat]) => project(lng, lat));
            const pathData = points.reduce(
              (acc, pt, idx) => (idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`),
              ''
            ) + ' Z';

            // Calculate centroid for label
            const centroid = points.reduce(
              (acc, pt) => ({ x: acc.x + pt.x / points.length, y: acc.y + pt.y / points.length }),
              { x: 0, y: 0 }
            );

            return (
              <g
                key={fid}
                className="cursor-pointer transition-all duration-200"
                onClick={() => onSelectField(fid)}
                onMouseEnter={() => setHoveredFieldId(fid)}
                onMouseLeave={() => setHoveredFieldId(null)}
              >
                <path
                  d={pathData}
                  fill={style.fill}
                  fillOpacity={isHovered ? 0.85 : isSelected ? 0.8 : style.fillOpacity}
                  stroke={isSelected ? '#0F766E' : isHovered ? '#1E293B' : style.stroke}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.8}
                  filter={isSelected ? 'url(#glow)' : undefined}
                />

                {/* Field ID Centroid Label */}
                {showLabels && (
                  <g pointerEvents="none">
                    <rect
                      x={centroid.x - 22}
                      y={centroid.y - 10}
                      width="44"
                      height="20"
                      rx="4"
                      fill={isSelected ? '#0F766E' : '#1E293B'}
                      fillOpacity={0.88}
                    />
                    <text
                      x={centroid.x}
                      y={centroid.y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="10"
                      fontWeight="bold"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {fid.replace('PC-', '#')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Floating Card Tooltip */}
        {hoveredFeature && (
          <div className="absolute top-6 left-6 z-10 bg-white/95 backdrop-blur-md rounded-xl p-3 shadow-lg border border-slate-200 text-xs w-64 pointer-events-none transition-all">
            <div className="flex items-center justify-between font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-1.5">
              <span>{hoveredFeature.properties.name} ({hoveredFeature.properties.id})</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusStyle(hoveredFeature.properties.stress_status).badgeBg}`}>
                {hoveredFeature.properties.stress_status?.toUpperCase() || 'NORMAL'}
              </span>
            </div>
            <div className="space-y-1 text-slate-600">
              <div className="flex justify-between">
                <span>Crop & Stage:</span>
                <span className="font-medium text-slate-800">{hoveredFeature.properties.crop} ({hoveredFeature.properties.stage})</span>
              </div>
              <div className="flex justify-between">
                <span>Area:</span>
                <span className="font-medium text-slate-800">{hoveredFeature.properties.area_acres} acres ({hoveredFeature.properties.area_ha || (hoveredFeature.properties.area_acres * 0.4047).toFixed(2)} ha)</span>
              </div>
              <div className="flex justify-between">
                <span>Stress Probability:</span>
                <span className="font-bold text-slate-900">{((hoveredFeature.properties.stress_probability || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                <span>Action:</span>
                <span className="font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                  {hoveredFeature.properties.recommended_action || 'wait'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-teal-600 font-semibold text-center bg-teal-50/80 py-1 rounded">
              Click polygon to inspect full driver analysis
            </div>
          </div>
        )}
      </div>

      {/* Map Legend and Status Counts Footer */}
      <div className="p-3 sm:p-4 bg-white border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" /> Stress Status:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></span>
            <span className="text-slate-600">Low ({statusCounts.green})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></span>
            <span className="text-slate-600">Moderate ({statusCounts.amber})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 border border-red-600"></span>
            <span className="text-slate-600 font-medium">High / Critical ({statusCounts.red})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 border border-blue-600"></span>
            <span className="text-slate-600">Pause / Deluge ({statusCounts.blue})</span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-slate-400" />
          <span>Coordinates: WGS84 peri-urban zone</span>
        </div>
      </div>
    </div>
  );
};
