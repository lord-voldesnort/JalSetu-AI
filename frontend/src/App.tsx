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
    <div className="min-h-screen flex flex-col bg-[#F5F8FB]">
      {/* Global Navigation Header */}
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
            {/* Cluster Status Hero Banner */}
            <div className="bg-gradient-to-r from-[#005151] to-[#0B8A8F] rounded-2xl p-6 sm:p-7 text-white shadow-md">
              <div className="max-w-3xl space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 text-white/95 backdrop-blur-sm border border-white/20">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                    Decision Engine Online
                  </span>
                  {activeScenarioId !== 'normal_01' && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Climate Shock Simulated: {activeScenarioId}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-normal tracking-tight font-display">
                  Pimpri-Chinchwad Agricultural Cluster Monitoring
                </h1>
                <p className="text-xs sm:text-sm text-teal-50/90 leading-relaxed">
                  Real-time observation of 10 demonstration fields in Pune peri-urban corridor. Synthesizing soil moisture, canopy vigor (NDVI), and evapotranspiration into actionable, deterministic irrigation guidance.
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center gap-6 text-xs text-teal-100/90">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span>Decision Loop: <strong>Observe → Forecast → Prioritize → Explain → Allocate</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-300" />
                  <span>Cluster: <strong>10 Monitored Fields (14.8 Acres Total)</strong></span>
                </div>
              </div>
            </div>

            {/* Error Message if API unreachable */}
            {fieldsError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Unable to load fields from backend: </span>
                  <span>{fieldsError}</span>
                  <p className="mt-1 text-[11px] text-red-600">Ensure the FastAPI backend server is running on http://localhost:8000.</p>
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-teal-600" />
                  <span>Field Registry & Diagnostic Action Cards</span>
                </h2>
                <span className="text-xs font-mono text-slate-500">
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
