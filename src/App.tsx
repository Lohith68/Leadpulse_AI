/**
 * LEADPULSE AI - Intelligent Lead Scoring & Sales Automation Platform
 * Main Enterprise CRM Application Entry Point
 */

import React, { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { OverviewDashboard } from './components/views/OverviewDashboard';
import { LeadsManagement } from './components/views/LeadsManagement';
import { CompaniesView } from './components/views/CompaniesView';
import { ContactsView } from './components/views/ContactsView';
import { CampaignsView } from './components/views/CampaignsView';
import { ActivitiesView } from './components/views/ActivitiesView';
import { ScoringEngineView } from './components/views/ScoringEngineView';
import { SalesRepsView } from './components/views/SalesRepsView';
import { TasksView } from './components/views/TasksView';
import { OpportunitiesView } from './components/views/OpportunitiesView';
import { StageHistoryView } from './components/views/StageHistoryView';
import { AnomalyDetectionView } from './components/views/AnomalyDetectionView';
import { ConsentManagementView } from './components/views/ConsentManagementView';
import { AnalyticsEvaluationView } from './components/views/AnalyticsEvaluationView';
import { DataManagementView } from './components/views/DataManagementView';
import { ValidationCenterView } from './components/views/ValidationCenterView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { SettingsView } from './components/views/SettingsView';
import { Sparkles, Database, CheckCircle2 } from 'lucide-react';

const CRMMainContent: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const { leads, isLoading, isSeeding, seedingProgress, seedDatabase } = useCRM();

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-900 selection:bg-purple-100 selection:text-purple-900">
      {/* Top Navbar */}
      <Navbar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeNav={activeNav}
        setActiveNav={setActiveNav}
      />

      {/* Main Body with Sidebar + View Viewport */}
      <div className="flex-1 flex overflow-hidden">
        {/* Collapsible Sidebar */}
        <Sidebar
          activeNav={activeNav}
          setActiveNav={setActiveNav}
          collapsed={!sidebarOpen}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* First-time Seeding Prompt if Database is Fresh */}
            {leads.length === 0 && !isLoading && !isSeeding && (
              <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-200 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Cloud Firestore Connected &amp; Ready
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    Welcome to LEADPULSE AI CRM
                  </h2>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Initialize your CRM sandbox with our deterministic benchmark dataset (SEED = 20261022). Generates realistic enterprise companies, decision makers, 100-point scored leads, automated SLA follow-ups, opportunities, and anomaly audits.
                  </p>
                </div>

                <button
                  onClick={() => seedDatabase(200)}
                  disabled={isSeeding}
                  className="px-6 py-3.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-black text-sm shadow-lg hover:shadow-purple-500/25 transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  Initialize 200 Benchmark Leads
                </button>
              </div>
            )}

            {/* Active Seeding Progress Banner */}
            {isSeeding && seedingProgress && (
              <div className="bg-white border border-purple-200 rounded-xl p-4 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-purple-900">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 animate-ping" />
                    {seedingProgress.message}
                  </span>
                  <span>{Math.round((seedingProgress.current / seedingProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-purple-700 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (seedingProgress.current / seedingProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* View Switcher Router */}
            {activeNav === 'overview' && <OverviewDashboard onNavigate={setActiveNav} />}
            {activeNav === 'leads' && <LeadsManagement />}
            {activeNav === 'companies' && <CompaniesView />}
            {activeNav === 'contacts' && <ContactsView />}
            {activeNav === 'campaigns' && <CampaignsView />}
            {activeNav === 'activities' && <ActivitiesView />}
            {activeNav === 'scoring' && <ScoringEngineView />}
            {activeNav === 'salesReps' && <SalesRepsView />}
            {activeNav === 'tasks' && <TasksView />}
            {activeNav === 'opportunities' && <OpportunitiesView onNavigate={setActiveNav} />}
            {activeNav === 'stageHistory' && <StageHistoryView />}
            {activeNav === 'anomalies' && <AnomalyDetectionView />}
            {activeNav === 'consent' && <ConsentManagementView />}
            {activeNav === 'analytics' && <AnalyticsEvaluationView />}
            {activeNav === 'dataManagement' && <DataManagementView />}
            {activeNav === 'validation' && <ValidationCenterView />}
            {activeNav === 'auditLogs' && <AuditLogsView />}
            {activeNav === 'settings' && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <CRMProvider>
      <CRMMainContent />
    </CRMProvider>
  );
}
