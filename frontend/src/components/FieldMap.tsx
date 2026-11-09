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
      const y = padding + ((maxY - lat) / (maxY - minY)) * (viewBoxHeight - 2 * padding);
      return { x, y };
    };
  }, [bounds, viewBoxWidth, viewBoxHeight, padding]);

  // Status-based color configuration aligned with palette
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'red':
        return {
          fill: '#B95B55', // Muted Tomato
          fillOpacity: 0.70,
          stroke: '#8A3C37',
          badgeBg: 'bg-[#B95B55]/15 text-[#8A3C37] border-[#B95B55]/40',
          label: 'High / Critical Stress',
        };
      case 'amber':
        return {
          fill: '#E5B94B', // Orchid Gold
          fillOpacity: 0.65,
          stroke: '#B88E28',
          badgeBg: 'bg-[#E5B94B]/20 text-[#69483A] border-[#E5B94B]/50',
          label: 'Moderate Stress',
        };
      case 'blue':
        return {
          fill: '#4B729F', // Muted Slate Blue
          fillOpacity: 0.65,
          stroke: '#2F4F75',
          badgeBg: 'bg-blue-100 text-blue-900 border-blue-300',
          label: 'Paused (Deluge / Protect)',
        };
      case 'green':
      default:
        return {
          fill: '#85845A', // Muted Olive
          fillOpacity: 0.65,
          stroke: '#585736',
          badgeBg: 'bg-[#85845A]/15 text-[#585736] border-[#85845A]/40',
          label: 'Low Stress / Nominal',
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
    <div className="bg-[#FFFCF6] rounded-2xl shadow-warm-md border border-[#E8D6C5] overflow-hidden">
      {/* Map Header */}
      <div className="p-4 sm:p-5 border-b border-[#E8D6C5] flex flex-wrap items-center justify-between gap-3 bg-[#F2E1D4]/30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C96D3B] to-[#B95B55] flex items-center justify-center text-[#FFFCF6] shadow-warm-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#382A25]">
              Interactive Field Spatial Geometry
            </h2>
            <p className="text-xs text-[#817064]">
              Pimpri-Chinchwad Peri-Urban Demonstration Cluster • 10 Monitored Polygons
            </p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`font-inter font-semibold text-[14px] px-4 py-2 rounded-xl border transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#C96D3B]/40 shadow-warm-sm ${
              showLabels
                ? 'bg-[#B95B55] hover:bg-[#A34E48] text-[#FFFCF6] border-transparent'
                : 'bg-[#FFFCF6] hover:bg-[#FAF5ED] text-[#69483A] hover:text-[#382A25] border-[#E8D6C5] hover:border-[#D99A91]'
            }`}
            title="Toggle field ID labels"
          >
            <Eye className="w-4 h-4" />
            <span>{showLabels ? 'Labels Visible' : 'Labels Hidden'}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas / SVG Container */}
      <div className="relative w-full bg-[#FAF5ED] p-2 sm:p-4">
        {loading && (
          <div className="absolute inset-0 bg-[#FFFCF6]/80 backdrop-blur-xs z-20 flex items-center justify-center">
            <div className="flex items-center gap-2.5 text-xs text-[#69483A] font-semibold bg-[#FFFCF6] px-4 py-2 rounded-xl border border-[#E8D6C5] shadow-warm-md">
              <div className="w-4 h-4 border-2 border-[#C96D3B] border-t-transparent rounded-full animate-spin"></div>
              <span>Updating spatial stress polygons...</span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto max-h-[500px] select-none rounded-xl bg-[#FAF5ED] border border-[#E8D6C5] shadow-inner"
        >
          {/* Subtle agricultural grid pattern */}
          <defs>
            <pattern id="agri-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#E8D6C5" strokeWidth="0.6" strokeOpacity="0.7" />
            </pattern>
            <filter id="poly-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#C96D3B" floodOpacity="0.85" />
            </filter>
          </defs>
          <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#agri-grid)" />

          {/* Demonstration Canal Reference Line */}
          <path
            d={`M 30 ${viewBoxHeight * 0.88} Q ${viewBoxWidth * 0.4} ${viewBoxHeight * 0.82} ${viewBoxWidth - 30} ${viewBoxHeight * 0.92}`}
            fill="none"
            stroke="#85845A"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeOpacity="0.65"
          />
          <text
            x={viewBoxWidth - 180}
            y={viewBoxHeight * 0.95}
            fill="#69483A"
            fontSize="10"
            fontFamily="sans-serif"
            fontStyle="italic"
            fontWeight="500"
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
                className="cursor-pointer transition-all duration-150"
                onClick={() => onSelectField(fid)}
                onMouseEnter={() => setHoveredFieldId(fid)}
                onMouseLeave={() => setHoveredFieldId(null)}
              >
                <path
                  d={pathData}
                  fill={style.fill}
                  fillOpacity={isHovered ? 0.90 : isSelected ? 0.85 : style.fillOpacity}
                  stroke={isSelected ? '#C96D3B' : isHovered ? '#382A25' : style.stroke}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.8}
                  filter={isSelected ? 'url(#poly-glow)' : undefined}
                />

                {/* Field ID Centroid Label */}
                {showLabels && (
                  <g pointerEvents="none">
                    <rect
                      x={centroid.x - 22}
                      y={centroid.y - 10}
                      width="44"
                      height="20"
                      rx="5"
                      fill={isSelected ? '#C96D3B' : '#382A25'}
                      fillOpacity={0.92}
                    />
                    <text
                      x={centroid.x}
                      y={centroid.y + 4}
                      textAnchor="middle"
                      fill="#FFFCF6"
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

        {/* Hover Tooltip Floating Card */}
        {hoveredFeature && (
          <div className="absolute top-6 left-6 z-10 bg-[#FFFCF6]/95 backdrop-blur-md rounded-xl p-3.5 shadow-warm-lg border border-[#E8D6C5] text-xs w-64 pointer-events-none transition-all">
            <div className="flex items-center justify-between font-bold text-[#382A25] border-b border-[#E8D6C5] pb-2 mb-2">
              <span>{hoveredFeature.properties.name} ({hoveredFeature.properties.id})</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusStyle(hoveredFeature.properties.stress_status).badgeBg}`}>
                {hoveredFeature.properties.stress_status?.toUpperCase() || 'NORMAL'}
              </span>
            </div>
            <div className="space-y-1.5 text-[#817064]">
              <div className="flex justify-between">
                <span>Crop & Stage:</span>
                <span className="font-semibold text-[#382A25] capitalize">{hoveredFeature.properties.crop} ({hoveredFeature.properties.stage})</span>
              </div>
              <div className="flex justify-between">
                <span>Area:</span>
                <span className="font-semibold text-[#382A25]">{hoveredFeature.properties.area_acres} acres ({hoveredFeature.properties.area_ha || (hoveredFeature.properties.area_acres * 0.4047).toFixed(2)} ha)</span>
              </div>
              <div className="flex justify-between">
                <span>Stress Probability:</span>
                <span className="font-bold text-[#B95B55]">{((hoveredFeature.properties.stress_probability || 0) * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-[#E8D6C5]/70">
                <span>Prescribed:</span>
                <span className="font-bold text-[#C96D3B] bg-[#C96D3B]/10 px-2 py-0.5 rounded capitalize">
                  {hoveredFeature.properties.recommended_action?.replace('_', ' ') || 'wait'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[#C96D3B] font-semibold text-center bg-[#F2E1D4]/50 py-1 rounded-md">
              Click polygon to inspect full driver analysis
            </div>
          </div>
        )}
      </div>

      {/* Map Legend and Status Counts Footer */}
      <div className="p-3 sm:p-4 bg-[#FFFCF6] border-t border-[#E8D6C5] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-[#382A25] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C96D3B]" /> Stress Status:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#85845A] border border-[#585736]"></span>
            <span className="text-[#817064]">Low ({statusCounts.green})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#E5B94B] border border-[#B88E28]"></span>
            <span className="text-[#817064]">Moderate ({statusCounts.amber})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#B95B55] border border-[#8A3C37]"></span>
            <span className="text-[#8A3C37] font-bold">High / Critical ({statusCounts.red})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-[#4B729F] border border-[#2F4F75]"></span>
            <span className="text-[#817064]">Pause / Deluge ({statusCounts.blue})</span>
          </div>
        </div>

        <div className="text-[11px] text-[#817064] flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#69483A]" />
          <span>Coordinates: WGS84 peri-urban agricultural zone</span>
        </div>
      </div>
    </div>
  );
};
