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

  // Agricultural field green color system (Part 2)
  const getFieldGreenShade = (crop?: string, fid?: string) => {
    const c = crop?.toLowerCase() || '';
    if (c.includes('tomato')) return { fill: '#438653', stroke: '#245C38', name: 'Crop Green' };
    if (c.includes('sugarcane')) return { fill: '#245C38', stroke: '#174026', name: 'Deep Crop Green' };
    if (c.includes('marigold')) return { fill: '#78AD76', stroke: '#245C38', name: 'Light Crop Green' };
    if (c.includes('pomegranate')) return { fill: '#2E6B41', stroke: '#1C4A2B', name: 'Orchard Green' };
    if (c.includes('onion')) return { fill: '#549662', stroke: '#245C38', name: 'Field Green' };
    if (c.includes('chilli') || c.includes('chili')) return { fill: '#3B7E4C', stroke: '#245C38', name: 'Emerald Green' };
    if (c.includes('maize') || c.includes('corn')) return { fill: '#4D885B', stroke: '#245C38', name: 'Maize Green' };
    if (c.includes('brinjal') || c.includes('eggplant')) return { fill: '#357146', stroke: '#245C38', name: 'Garden Green' };
    const num = parseInt(fid?.replace(/\D/g, '') || '1', 10);
    const greens = ['#438653', '#245C38', '#78AD76', '#2E6B41', '#549662', '#3B7E4C'];
    return { fill: greens[num % greens.length], stroke: '#245C38', name: 'Agricultural Green' };
  };

  // Documented semantic risk mapping (Part 4)
  const getRiskStyle = (status?: string) => {
    switch (status) {
      case 'red':
        return {
          badgeBg: 'bg-[#D32F2F]/15 text-[#D32F2F] border-[#D32F2F]/40',
          dotColor: '#D32F2F',
          label: 'High / Critical Stress',
        };
      case 'amber':
        return {
          badgeBg: 'bg-[#D97706]/15 text-[#D97706] border-[#D97706]/40',
          dotColor: '#D97706',
          label: 'Moderate Stress',
        };
      case 'blue':
        return {
          badgeBg: 'bg-[#299BCB]/15 text-[#123B66] border-[#299BCB]/40',
          dotColor: '#299BCB',
          label: 'Paused (Deluge / Protect)',
        };
      case 'green':
      default:
        return {
          badgeBg: 'bg-[#438653]/15 text-[#245C38] border-[#438653]/40',
          dotColor: '#438653',
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
    <div className="bg-[#FFFFFF] rounded-2xl shadow-ocean-md border border-[#E2E8F0] overflow-hidden">
      {/* Map Header */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 bg-[#F5F8FC]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#299BCB] to-[#123B66] flex items-center justify-center text-[#FFFFFF] shadow-ocean-sm">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-[#123B66]">
              Interactive Field Spatial Geometry
            </h2>
            <p className="text-xs text-[#64748B]">
              Pimpri-Chinchwad Peri-Urban Demonstration Cluster • 10 Monitored Agricultural Plots
            </p>
          </div>
        </div>

        {/* Map Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`font-inter font-semibold text-[14px] px-4 py-2 rounded-xl border transition-all duration-150 inline-flex items-center justify-center gap-2 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-[#299BCB]/40 shadow-ocean-sm ${
              showLabels
                ? 'bg-[#299BCB] hover:bg-[#2184AD] text-[#FFFFFF] border-transparent'
                : 'bg-[#FFFFFF] hover:bg-[#F5F8FC] text-[#123B66] hover:text-[#299BCB] border-[#CBD5E1] hover:border-[#299BCB]'
            }`}
            title="Toggle field ID labels"
          >
            <Eye className="w-4 h-4" />
            <span>{showLabels ? 'Labels Visible' : 'Labels Hidden'}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas / SVG Container */}
      <div className="relative w-full bg-[#F5F8FC] p-2 sm:p-4">
        {loading && (
          <div className="absolute inset-0 bg-[#FFFFFF]/80 backdrop-blur-xs z-20 flex items-center justify-center">
            <div className="flex items-center gap-2.5 text-xs text-[#123B66] font-semibold bg-[#FFFFFF] px-4 py-2 rounded-xl border border-[#CBD5E1] shadow-ocean-md">
              <div className="w-4 h-4 border-2 border-[#299BCB] border-t-transparent rounded-full animate-spin"></div>
              <span>Updating spatial field polygons...</span>
            </div>
          </div>
        )}

        <svg
          viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
          className="w-full h-auto max-h-[500px] select-none rounded-xl bg-[#F5F8FC] border border-[#CBD5E1] shadow-inner"
        >
          {/* Subtle agricultural grid pattern */}
          <defs>
            <pattern id="agri-grid" width="36" height="36" patternUnits="userSpaceOnUse">
              <path d="M 36 0 L 0 0 0 36" fill="none" stroke="#E2E8F0" strokeWidth="0.8" strokeOpacity="0.8" />
            </pattern>
            <filter id="poly-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#F29A38" floodOpacity="0.8" />
            </filter>
          </defs>
          <rect width={viewBoxWidth} height={viewBoxHeight} fill="url(#agri-grid)" />

          {/* Demonstration Canal Reference Line in Freshwater Blue */}
          <path
            d={`M 30 ${viewBoxHeight * 0.88} Q ${viewBoxWidth * 0.4} ${viewBoxHeight * 0.82} ${viewBoxWidth - 30} ${viewBoxHeight * 0.92}`}
            fill="none"
            stroke="#299BCB"
            strokeWidth="3.5"
            strokeDasharray="6 4"
            strokeOpacity="0.85"
          />
          <text
            x={viewBoxWidth - 190}
            y={viewBoxHeight * 0.95}
            fill="#123B66"
            fontSize="10"
            fontFamily="sans-serif"
            fontStyle="italic"
            fontWeight="600"
          >
            Pavana Irrigation Canal Corridor
          </text>

          {/* Render Field Polygons in Shades of Green (Part 2) */}
          {fields?.features?.map((feat) => {
            const fid = feat.properties.id;
            const isSelected = selectedFieldId === fid;
            const isHovered = hoveredFieldId === fid;
            const greenStyle = getFieldGreenShade(feat.properties.crop, fid);
            const riskStyle = getRiskStyle(feat.properties.stress_status);

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
                  fill={greenStyle.fill}
                  fillOpacity={isHovered ? 0.90 : isSelected ? 0.85 : 0.72}
                  stroke={isSelected ? '#F29A38' : isHovered ? '#123B66' : greenStyle.stroke}
                  strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 2.0}
                  filter={isSelected ? 'url(#poly-glow)' : undefined}
                />

                {/* Field ID Centroid Label with Semantic Risk Dot */}
                {showLabels && (
                  <g pointerEvents="none">
                    <rect
                      x={centroid.x - 26}
                      y={centroid.y - 10}
                      width="52"
                      height="20"
                      rx="6"
                      fill={isSelected ? '#123B66' : '#245C38'}
                      fillOpacity={0.94}
                      stroke={isSelected ? '#F29A38' : '#78AD76'}
                      strokeWidth={isSelected ? 1.5 : 0.8}
                    />
                    <text
                      x={centroid.x - 5}
                      y={centroid.y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9.5"
                      fontWeight="bold"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {fid.replace('PC-', '#')}
                    </text>
                    {/* Semantic Risk Indicator Dot */}
                    <circle
                      cx={centroid.x + 16}
                      cy={centroid.y}
                      r="4"
                      fill={riskStyle.dotColor}
                      stroke="#FFFFFF"
                      strokeWidth="1.2"
                    />
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Floating Card */}
        {hoveredFeature && (
          <div className="absolute top-6 left-6 z-10 bg-[#FFFFFF]/95 backdrop-blur-md rounded-xl p-3.5 shadow-ocean-lg border border-[#CBD5E1] text-xs w-64 pointer-events-none transition-all">
            <div className="flex items-center justify-between font-bold text-[#123B66] border-b border-[#E2E8F0] pb-2 mb-2">
              <span>{hoveredFeature.properties.name} ({hoveredFeature.properties.id})</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getRiskStyle(hoveredFeature.properties.stress_status).badgeBg}`}>
                {hoveredFeature.properties.stress_status?.toUpperCase() || 'LOW'}
              </span>
            </div>
            <div className="space-y-1.5 text-[#334155]">
              <div className="flex justify-between items-center">
                <span>Crop:</span>
                <span className="font-semibold text-[#245C38] bg-[#E8F2E5] px-2 py-0.5 rounded border border-[#78AD76]/40 capitalize">
                  {hoveredFeature.properties.crop} ({hoveredFeature.properties.stage})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Area:</span>
                <span className="font-semibold text-[#123B66]">
                  {hoveredFeature.properties.area_acres} acres ({hoveredFeature.properties.area_ha || (hoveredFeature.properties.area_acres * 0.4047).toFixed(2)} ha)
                </span>
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex justify-between items-center">
                  <span>Stress Level:</span>
                  <span className="font-bold font-mono text-[#1976B9]">
                    {((hoveredFeature.properties.stress_probability || 0) * 100).toFixed(0)}%
                  </span>
                </div>
                {/* Percentage bar in shades of blue with pale blue track (Part 3) */}
                <div className="w-full bg-[#DCEFF8] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#299BCB] h-1.5 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(0, (hoveredFeature.properties.stress_probability || 0) * 100))}%` }}
                  ></div>
                </div>
              </div>
              <div className="flex justify-between items-center pt-1.5 border-t border-[#E2E8F0]">
                <span>Prescribed:</span>
                <span className="font-bold text-[#123B66] bg-[#299BCB]/15 px-2 py-0.5 rounded capitalize">
                  {hoveredFeature.properties.recommended_action?.replace('_', ' ') || 'wait'}
                </span>
              </div>
            </div>
            <div className="mt-2 text-[10px] text-[#299BCB] font-semibold text-center bg-[#F5F8FC] py-1 rounded-md">
              Click plot to inspect full driver analysis
            </div>
          </div>
        )}
      </div>

      {/* Map Legend and Status Counts Footer */}
      <div className="p-3 sm:p-4 bg-[#FFFFFF] border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-[#123B66] flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#299BCB]" /> Field Plots (Green):
          </span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#438653] border border-[#245C38]"></span>
            <span className="text-[#334155]">Crop Green</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#245C38] border border-[#174026]"></span>
            <span className="text-[#334155]">Deep Crop</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#78AD76] border border-[#245C38]"></span>
            <span className="text-[#334155]">Light Crop</span>
          </div>

          <span className="h-4 w-px bg-[#CBD5E1] mx-1 hidden sm:block"></span>

          <span className="font-bold text-[#123B66]">Risk Status:</span>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#438653]"></span>
            <span className="text-[#334155]">Low ({statusCounts.green})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]"></span>
            <span className="text-[#334155]">Moderate ({statusCounts.amber})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F]"></span>
            <span className="text-[#D32F2F] font-bold">High / Crit ({statusCounts.red})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#299BCB]"></span>
            <span className="text-[#334155]">Paused ({statusCounts.blue})</span>
          </div>
        </div>

        <div className="text-[11px] text-[#64748B] flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#299BCB]" />
          <span>Coordinates: WGS84 peri-urban agricultural zone</span>
        </div>
      </div>
    </div>
  );
};
