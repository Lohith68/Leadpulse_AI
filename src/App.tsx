/**
 * LEADPULSE AI - Intelligent Lead Scoring & Sales Automation Platform
 * Main Enterprise CRM Application Entry Point
 * Implements Full Authentication, 5-Role RBAC, and Light/Dark Enterprise SaaS Theming
 */

import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CRMProvider, useCRM } from './context/CRMContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { LoginView } from './components/views/LoginView';
import { AccountInactiveView } from './components/views/AccountInactiveView';
import { AccessDeniedView } from './components/views/AccessDeniedView';
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
import { UserManagementView } from './components/views/UserManagementView';
import { SettingsView } from './components/views/SettingsView';
import { Sparkles, Database, Loader2, Eye, ShieldAlert, ArrowLeft } from 'lucide-react';

const CRMMainContent: React.FC = () => {
  const [activeNav, setActiveNav] = useState<string>('overview');
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  const {
    isAuthenticated,
    isLoadingAuth,
    status,
    activeRole,
    actualRole,
    isDemoMode,
    setPreviewRole,
    canAccessNav,
  } = useAuth();

  const { leads, isLoading, isSeeding, seedingProgress, seedDatabase } = useCRM();

  // 1. Loading splash while verifying auth session
  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#0B1428] flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#2563EB] text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">LEADPULSE AI</h2>
            <p className="text-xs text-slate-400 mt-1">Verifying secure session &amp; role clearance...</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated: Render Login View
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // 3. Inactive / Suspended account check
  if (status === 'inactive') {
    return <AccountInactiveView />;
  }

  const isNavAuthorized = canAccessNav(activeNav);

  return (
    <div className="min-h-screen bg-[#F1F5F9] dark:bg-[#0B1220] flex flex-col font-sans text-[#0F172A] dark:text-[#F8FAFC] transition-colors">
      {/* Admin 5-Role Demo Mode Warning Banner */}
      {isDemoMode && (
        <div className="bg-amber-400 dark:bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold flex flex-wrap items-center justify-between gap-2 border-b border-amber-500 shadow-sm z-50">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-black text-amber-300 font-mono text-[10px] uppercase tracking-wider font-extrabold">
              DEMO / PREVIEW MODE
            </span>
            <span>
              Viewing LeadPulse AI as <strong>{activeRole}</strong>. Navigation, action buttons, and permissions reflect strict role clearance.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] text-amber-950 hidden sm:inline">
              Actual Account: {actualRole}
            </span>
            <button
              onClick={() => setPreviewRole('Admin')}
              className="px-3 py-1 bg-slate-950 text-white hover:bg-slate-800 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
            >
              Exit Preview (Return to Admin)
            </button>
          </div>
        </div>
      )}

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
          setCollapsed={setSidebarOpen}
        />

        {/* Viewport Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* First-time Seeding Prompt if Database is Fresh (Admin only) */}
            {leads.length === 0 && !isLoading && !isSeeding && activeRole === 'Admin' && (
              <div className="bg-gradient-to-r from-[#101B33] via-[#0B1428] to-[#1E293B] text-white rounded-2xl p-6 sm:p-8 shadow-xl border border-slate-700/60 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    Cloud Firestore Online &amp; Seed Ready
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
                  className="px-6 py-3.5 rounded-xl bg-[#2563EB] hover:bg-blue-500 text-white font-black text-sm shadow-lg shadow-blue-600/30 transition-all shrink-0 flex items-center gap-2 cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  Initialize 200 Benchmark Leads
                </button>
              </div>
            )}

            {/* Active Seeding Progress Banner */}
            {isSeeding && seedingProgress && (
              <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-4 shadow-sm space-y-2">
                <div className="flex justify-between items-center text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB] animate-ping" />
                    {seedingProgress.message}
                  </span>
                  <span>{Math.round((seedingProgress.current / seedingProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#2563EB] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (seedingProgress.current / seedingProgress.total) * 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* View Switcher Router with RBAC Guard */}
            {!isNavAuthorized ? (
              <AccessDeniedView onNavigateHome={() => setActiveNav('overview')} />
            ) : (
              <>
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
                {activeNav === 'userManagement' && <UserManagementView />}
                {activeNav === 'settings' && <SettingsView />}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CRMProvider>
          <CRMMainContent />
        </CRMProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
