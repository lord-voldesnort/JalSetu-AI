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
  AlertTriangle
} from 'lucide-react';

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

  return (
    <div className="min-h-screen flex flex-col bg-[#F5EFE3] text-[#2C201C]">
      {/* Global Navigation Header in Deep Cocoa */}
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
            {/* Cluster Status Hero Banner with Agricultural Photography */}
            <div className="relative rounded-2xl overflow-hidden shadow-warm-md border border-[#E8D6C5]">
              <img
                src="/images/hero-tomatoes.jpg"
                alt="Ripe tomatoes on vine in sunlit agricultural field"
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="relative bg-gradient-to-r from-[#382A25]/95 via-[#382A25]/85 to-[#69483A]/70 p-6 sm:p-8 text-[#FFFCF6]">
                <div className="max-w-2xl space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C96D3B]/30 text-[#E8D6C5] backdrop-blur-xs border border-[#C96D3B]/40">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#E5B94B]" />
                      Decision Engine Online
                    </span>
                    {activeScenarioId !== 'normal_01' && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#B95B55]/30 text-[#E8D6C5] border border-[#B95B55]/40">
                        <AlertTriangle className="w-3.5 h-3.5 text-[#E5B94B]" />
                        Active Shock Mode: {activeScenarioId}
                      </span>
                    )}
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight font-display text-[#FFFCF6]">
                    Pimpri-Chinchwad Agricultural Cluster Monitoring
                  </h1>
                  <p className="text-xs sm:text-sm text-[#E8D6C5]/90 leading-relaxed">
                    Closed-loop water allocation intelligence across 10 demonstration fields in the Pune peri-urban corridor. Synthesizing soil moisture, canopy vigor (NDVI), and evapotranspiration into actionable, deterministic irrigation guidance.
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#69483A]/80 flex flex-wrap items-center gap-6 text-xs text-[#E8D6C5]">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#E5B94B] animate-pulse"></div>
                    <span>Decision Loop: <strong>Observe → Forecast → Prioritize → Explain → Allocate</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#E5B94B]" />
                    <span>Cluster: <strong>10 Monitored Fields (14.8 Acres Total)</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message if API unreachable */}
            {fieldsError && (
              <div className="p-4 bg-[#B95B55]/10 border border-[#B95B55]/30 rounded-2xl text-xs text-[#8A3C37] flex items-start gap-2.5 shadow-warm-sm">
                <AlertTriangle className="w-4 h-4 text-[#B95B55] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Unable to load fields from backend: </span>
                  <span>{fieldsError}</span>
                  <p className="mt-1 text-[11px] text-[#817064]">Ensure the FastAPI backend server is running on http://localhost:8000.</p>
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
                <h2 className="text-base font-bold text-[#382A25] flex items-center gap-2 font-display">
                  <Layers className="w-4 h-4 text-[#C96D3B]" />
                  <span>Field Registry & Diagnostic Action Cards</span>
                </h2>
                <span className="text-xs font-mono font-bold text-[#69483A] bg-[#FFFCF6] px-3 py-1 rounded-md border border-[#E8D6C5]">
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
