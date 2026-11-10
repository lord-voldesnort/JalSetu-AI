import React, { useState, useEffect, useCallback } from 'react';
import { Header, AppTab } from './components/Header';
import { Footer } from './components/Footer';
import { FieldMap } from './components/FieldMap';
import { FieldRegistry } from './components/FieldRegistry';
import { FieldDetailModal } from './components/FieldDetailModal';
import { ForecastView } from './components/ForecastView';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { WaterPlanner } from './components/WaterPlanner';
import { AuditView } from './components/AuditView';
import { api } from './api/client';
import { HealthResponse, FieldFeatureCollection } from './types/api';
import {
  ShieldCheck,
  Layers,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sprout
} from 'lucide-react';

interface CropSlide {
  id: string;
  name: string;
  vernacular: string;
  image: string;
  description: string;
  stage: string;
}

const CROP_SLIDES: CropSlide[] = [
  {
    id: 'tomato',
    name: 'Tomato',
    vernacular: 'Tamatar / टोमॅटो',
    image: '/images/crops/01-tomato.jpg',
    description: 'Active Peri-Urban Trellis Canopy & High Evaporative Demand',
    stage: 'Fruiting Stage',
  },
  {
    id: 'chilli',
    name: 'Green Chilli',
    vernacular: 'Mirchi / मिरची',
    image: '/images/crops/02-green-chilli.jpg',
    description: 'Moisture-Sensitive Flowering & Pod Development Phase',
    stage: 'Flowering & Setting',
  },
  {
    id: 'brinjal',
    name: 'Brinjal / Eggplant',
    vernacular: 'Vangi / वांगी',
    image: '/images/crops/03-brinjal.jpg',
    description: 'Deep-Rooted Vegetable Plot with Measured Water Infiltration',
    stage: 'Vegetative Growth',
  },
  {
    id: 'okra',
    name: 'Okra / Bhindi',
    vernacular: 'Bhendi / भेंडी',
    image: '/images/crops/04-okra.jpg',
    description: 'Warm-Season High-Transpiration Stand with Drip Scheduling',
    stage: 'Harvest Window',
  },
  {
    id: 'onion',
    name: 'Onion',
    vernacular: 'Kanda / कांदा',
    image: '/images/crops/05-onion.jpg',
    description: 'Bulb Development Irrigation Phase Demanding Regulated Saturation',
    stage: 'Bulb Formation',
  },
  {
    id: 'cabbage',
    name: 'Cabbage',
    vernacular: 'Patta Gobi / कोबी',
    image: '/images/crops/06-cabbage.jpg',
    description: 'Dense Head Moisture-Retention Zone in Deep Soil Bed',
    stage: 'Head Formation',
  },
  {
    id: 'cauliflower',
    name: 'Cauliflower',
    vernacular: 'Phool Gobi / फ्लॉवर',
    image: '/images/crops/07-cauliflower.jpg',
    description: 'Critical Curd Development Window Vulnerable to Soil Dryness',
    stage: 'Curd Development',
  },
  {
    id: 'spinach',
    name: 'Spinach',
    vernacular: 'Palak / पालक',
    image: '/images/crops/08-spinach.jpg',
    description: 'High-Frequency Leafy Green Plot with Shallow Root Zone',
    stage: 'Active Harvesting',
  },
  {
    id: 'maize',
    name: 'Maize / Sweet Corn',
    vernacular: 'Makka / मका',
    image: '/images/crops/09-maize.jpg',
    description: 'Silking & Tasseling Water Priority Requiring Evaporative Protection',
    stage: 'Silking & Tasseling',
  },
];

export const App: React.FC = () => {
  // Navigation & Global Context
  const [activeTab, setActiveTab] = useState<AppTab>('observe');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('normal_01');
  const [userRole, setUserRole] = useState<string>('farmer');

  // Selected Field for Deep Detail / Forecast
  const [selectedFieldId, setSelectedFieldId] = useState<string>('PC-001');
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [detailFieldId, setDetailFieldId] = useState<string | null>(null);

  // Backend Health
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthLoading, setHealthLoading] = useState<boolean>(true);

  // Fields Data
  const [fields, setFields] = useState<FieldFeatureCollection | null>(null);
  const [fieldsLoading, setFieldsLoading] = useState<boolean>(true);
  const [fieldsError, setFieldsError] = useState<string | null>(null);

  // Opening Crop Slideshow state
  const [cropSlideIndex, setCropSlideIndex] = useState<number>(0);
  const [isSlideshowPaused, setIsSlideshowPaused] = useState<boolean>(false);

  // Auto-play crop slideshow every 5.5 seconds
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
      return; // Do not auto-advance if user prefers reduced motion
    }

    const interval = setInterval(() => {
      if (!document.hidden && !isSlideshowPaused) {
        setCropSlideIndex((prev) => (prev + 1) % CROP_SLIDES.length);
      }
    }, 5500);

    return () => clearInterval(interval);
  }, [isSlideshowPaused]);

  // Healthcheck
  const checkHealth = useCallback(async () => {
    setHealthLoading(true);
    try {
      const data = await api.checkHealth();
      setHealth(data);
    } catch {
      setHealth(null);
    } finally {
      setHealthLoading(false);
    }
  }, []);

  // Load Fields for Active Scenario
  const loadFields = useCallback(async (scenarioId: string) => {
    setFieldsLoading(true);
    setFieldsError(null);
    try {
      const data = await api.getFields(scenarioId);
      setFields(data);
    } catch (err: unknown) {
      setFields(null);
      const msg = err instanceof Error ? err.message : 'Could not fetch fields';
      setFieldsError(msg);
    } finally {
      setFieldsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();
  }, [checkHealth]);

  useEffect(() => {
    loadFields(activeScenarioId);
  }, [activeScenarioId, loadFields]);

  // Handlers for user interactions
  const handleOpenDetail = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setDetailFieldId(fieldId);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
  };

  const handleViewForecast = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setActiveTab('forecast');
  };

  const handleQuickLog = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setDetailFieldId(fieldId);
    setIsDetailModalOpen(true);
  };

  const handleScenarioChange = (newScenarioId: string) => {
    setActiveScenarioId(newScenarioId);
  };

  const nextCropSlide = () => {
    setCropSlideIndex((prev) => (prev + 1) % CROP_SLIDES.length);
  };

  const prevCropSlide = () => {
    setCropSlideIndex((prev) => (prev - 1 + CROP_SLIDES.length) % CROP_SLIDES.length);
  };

  const activeCrop = CROP_SLIDES[cropSlideIndex];

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F8FC] text-[#0F172A]">
      {/* Global Navigation Header in Ocean Blue */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        activeScenarioId={activeScenarioId}
        userRole={userRole}
        onRoleChange={setUserRole}
        health={health}
        healthLoading={healthLoading}
      />

      {/* Main Workspace Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* TAB 1: FIELD MONITORING & SPATIAL MAP */}
        {activeTab === 'observe' && (
          <div className="space-y-6">
            {/* Cluster Status Hero Banner with 9-Crop Agricultural Photography Slideshow */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-ocean-md border border-[#E2E8F0] min-h-[260px] sm:min-h-[240px]"
              onMouseEnter={() => setIsSlideshowPaused(true)}
              onMouseLeave={() => setIsSlideshowPaused(false)}
            >
              {/* Stacked Crop Photographs with Smooth Crossfade */}
              {CROP_SLIDES.map((crop, idx) => (
                <img
                  key={crop.id}
                  src={crop.image}
                  alt={`${crop.name} - ${crop.description}`}
                  className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ease-in-out ${
                    idx === cropSlideIndex ? 'opacity-100' : 'opacity-0 pointer-events-none'
                  }`}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ))}

              {/* Ocean Blue Contrast Gradient Overlay for Readability */}
              <div className="relative bg-gradient-to-r from-[#123B66]/95 via-[#123B66]/88 to-[#299BCB]/70 p-6 sm:p-8 text-[#FFFFFF] flex flex-col justify-between h-full">
                <div className="max-w-2xl space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#438653]/35 text-[#FFFFFF] backdrop-blur-xs border border-[#78AD76]/50">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#76C4E5]" />
                      Decision Engine Online
                    </span>
                    {activeScenarioId !== 'normal_01' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D32F2F]/30 text-[#FFFFFF] border border-[#D32F2F]/50">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#F29A38]" />
                        Active Shock Mode: {activeScenarioId}
                      </span>
                    )}

                    {/* Active Crop Slideshow Badge */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#FFFFFF]/15 text-[#FFFFFF] backdrop-blur-xs border border-[#FFFFFF]/25">
                      <Sprout className="w-3.5 h-3.5 text-[#78AD76]" />
                      <span>
                        Crop {cropSlideIndex + 1} of {CROP_SLIDES.length}: <strong>{activeCrop.name}</strong>
                      </span>
                    </div>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display text-[#FFFFFF]">
                    Pimpri-Chinchwad Agricultural Cluster Monitoring
                  </h1>
                  <p className="text-xs sm:text-sm text-[#F5F8FC]/90 leading-relaxed">
                    Closed-loop water allocation intelligence across 10 demonstration fields in the Pune peri-urban corridor. Synthesizing soil moisture, canopy vigor (NDVI), and evapotranspiration into actionable, deterministic irrigation guidance.
                  </p>
                </div>

                {/* Slideshow Indicator & Navigation Strip */}
                <div className="mt-6 pt-4 border-t border-[#299BCB]/40 flex flex-wrap items-center justify-between gap-4 text-xs text-[#E8F2E5]">
                  <div className="flex flex-wrap items-center gap-5">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#76C4E5] animate-pulse"></div>
                      <span>Decision Loop: <strong>Observe → Forecast → Prioritize → Explain → Allocate</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-[#76C4E5]" />
                      <span>Cluster: <strong>10 Monitored Fields (14.8 Acres Total)</strong></span>
                    </div>
                  </div>

                  {/* Crop Slideshow Interactive Dot Track */}
                  <div className="flex items-center gap-2 bg-[#123B66]/60 backdrop-blur-xs px-3 py-1.5 rounded-full border border-[#FFFFFF]/20">
                    <button
                      onClick={prevCropSlide}
                      className="p-1 hover:bg-[#FFFFFF]/20 rounded-full transition text-[#FFFFFF]"
                      title="Previous crop"
                      aria-label="Previous crop"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center gap-1.5 px-1">
                      {CROP_SLIDES.map((c, i) => (
                        <button
                          key={c.id}
                          onClick={() => setCropSlideIndex(i)}
                          title={`${c.name} (${c.stage})`}
                          className={`transition-all rounded-full ${
                            i === cropSlideIndex
                              ? 'w-5 h-2 bg-[#299BCB] shadow-xs'
                              : 'w-2 h-2 bg-[#FFFFFF]/40 hover:bg-[#FFFFFF]/70'
                          }`}
                          aria-label={`Jump to ${c.name}`}
                        />
                      ))}
                    </div>
                    <button
                      onClick={nextCropSlide}
                      className="p-1 hover:bg-[#FFFFFF]/20 rounded-full transition text-[#FFFFFF]"
                      title="Next crop"
                      aria-label="Next crop"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message if API unreachable */}
            {fieldsError && (
              <div className="p-4 bg-[#D32F2F]/10 border border-[#D32F2F]/30 rounded-2xl text-xs text-[#D32F2F] flex items-start gap-2.5 shadow-ocean-sm">
                <AlertTriangle className="w-4 h-4 text-[#D32F2F] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Unable to load fields from backend: </span>
                  <span>{fieldsError}</span>
                  <p className="mt-1 text-[11px] text-[#64748B]">Ensure the FastAPI backend server is running on http://localhost:8000.</p>
                </div>
              </div>
            )}

            {/* Spatial Field Map */}
            <FieldMap
              fields={fields}
              selectedFieldId={selectedFieldId}
              onSelectField={handleOpenDetail}
              loading={fieldsLoading}
            />

            {/* Field Registry and Cards Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-[#123B66] flex items-center gap-2 font-display">
                  <Layers className="w-4 h-4 text-[#299BCB]" />
                  <span>Field Registry & Diagnostic Action Cards</span>
                </h2>
                <span className="text-xs font-mono font-bold text-[#123B66] bg-[#FFFFFF] px-3 py-1 rounded-md border border-[#CBD5E1]">
                  {fields?.features?.length || 0} Fields Monitored
                </span>
              </div>

              <FieldRegistry
                fields={fields}
                selectedFieldId={selectedFieldId}
                onSelectField={handleOpenDetail}
                onViewForecast={handleViewForecast}
                onQuickLog={handleQuickLog}
              />
            </div>
          </div>
        )}

        {/* TAB 2: 3–7 DAY FORECAST */}
        {activeTab === 'forecast' && (
          <ForecastView
            fields={fields}
            selectedFieldId={selectedFieldId}
            scenarioId={activeScenarioId}
            onSelectField={setSelectedFieldId}
          />
        )}

        {/* TAB 3: CLIMATE SHOCK SIMULATOR */}
        {activeTab === 'scenarios' && (
          <ScenarioSimulator
            activeScenarioId={activeScenarioId}
            onScenarioChanged={handleScenarioChange}
          />
        )}

        {/* TAB 4: WATER BUDGET PLANNER */}
        {activeTab === 'planner' && (
          <WaterPlanner scenarioId={activeScenarioId} />
        )}

        {/* TAB 5: AUDIT TRAIL & METRICS */}
        {activeTab === 'audit' && (
          <AuditView
            fields={fields}
            userRole={userRole}
          />
        )}
      </main>

      {/* Field Detail & Agronomic Driver Attribution Modal */}
      <FieldDetailModal
        fieldId={detailFieldId}
        scenarioId={activeScenarioId}
        userRole={userRole}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetail}
        onViewForecast={handleViewForecast}
        onActionRecorded={() => {
          loadFields(activeScenarioId);
        }}
      />

      {/* Application Footer */}
      <Footer />
    </div>
  );
};

export default App;
