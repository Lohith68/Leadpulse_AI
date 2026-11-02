import React, { useState } from 'react';
import {
  Search,
  Bell,
  Menu,
  ChevronDown,
  UserCheck,
  LogOut,
  Shield,
  Eye,
  Check,
  Sun,
  Moon,
  Sparkles,
  Layers,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types/crm';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  activeNav,
  setActiveNav,
}) => {
  const { dbConnected, connectionStatus, anomalies } = useCRM();
  const {
    currentUser,
    userProfile,
    actualRole,
    activeRole,
    previewRole,
    setPreviewRole,
    isDemoMode,
    logout,
  } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const activeAnomaliesCount = anomalies.filter(a => a.status === 'DETECTED').length;

  const roles: UserRole[] = [
    'Admin',
    'Sales Manager',
    'Sales Representative',
    'Marketing',
    'Analyst',
  ];

  // Derive human-readable page title
  const pageTitles: Record<string, string> = {
    overview: 'Overview Dashboard',
    leads: activeRole === 'Sales Representative' ? 'My Assigned Leads' : 'Leads Management',
    companies: 'Accounts & Companies',
    contacts: 'Contact Directory',
    campaigns: 'Marketing Campaigns',
    activities: 'Customer Touchpoints & Activities',
    scoring: 'Lead Scoring Engine & Rules',
    salesReps: 'Sales Representatives',
    tasks: activeRole === 'Sales Representative' ? 'My Follow-up Tasks' : 'Follow-up Tasks & SLAs',
    opportunities: activeRole === 'Sales Representative' ? 'My Sales Pipeline' : 'Opportunities & Pipeline',
    stageHistory: 'Opportunity Stage History',
    anomalies: 'Security & Anomaly Detection',
    consent: 'GDPR / CCPA Consent Management',
    analytics: 'Analytics & Model Evaluation',
    dataManagement: 'Synthetic Data Generator',
    validation: 'Data Integrity Validation Center',
    auditLogs: 'Immutable Audit Ledger',
    userManagement: 'User Management & Role Governance',
    settings: 'Platform Settings',
  };

  const currentTitle = pageTitles[activeNav] || 'Dashboard';

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-[#111C2E] border-b border-[#E2E8F0] dark:border-[#263449] h-16 flex items-center justify-between px-4 sm:px-6 shadow-xs transition-colors">
      {/* Left: Mobile Toggle & Current Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title="Toggle Sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
            {currentTitle}
          </h1>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
            <span>·</span>
            <span>LEADPULSE Enterprise</span>
          </span>
        </div>
      </div>

      {/* Center: Search Field */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search leads, companies, contacts, opportunities..."
            className="w-full bg-[#F1F5F9] dark:bg-[#0B1220] hover:bg-slate-200/60 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-[#111C2E] text-xs pl-9 pr-4 py-2 rounded-xl border border-transparent focus:border-[#2563EB] dark:focus:border-[#3B82F6] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setActiveNav('leads');
              }
            }}
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600" />
          )}
        </button>

        {/* Anomaly / Notifications Bell */}
        <button
          onClick={() => setActiveNav('anomalies')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={`${activeAnomaliesCount} Active Anomalies Detected`}
        >
          <Bell className="w-4 h-4" />
          {activeAnomaliesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444] animate-ping" />
          )}
          {activeAnomaliesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#EF4444]" />
          )}
        </button>

        {/* Database Online Status */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-[11px] font-semibold text-slate-600 dark:text-slate-300"
          title={connectionStatus}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              dbConnected ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'
            }`}
          />
          <span>{dbConnected ? 'Firestore' : 'Connecting'}</span>
        </div>

        {/* Admin-only Role Preview Selector */}
        {actualRole === 'Admin' && (
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                isDemoMode
                  ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 dark:border-amber-600'
                  : 'border-[#E2E8F0] dark:border-[#263449] bg-white dark:bg-[#111C2E] hover:bg-slate-50 dark:hover:bg-slate-800 text-[#0F172A] dark:text-[#F8FAFC]'
              }`}
              title="Admin 5-Role Demonstration Switcher"
            >
              <Eye className={`w-3.5 h-3.5 ${isDemoMode ? 'text-amber-600 dark:text-amber-400' : 'text-[#2563EB]'}`} />
              <span className="hidden sm:inline text-slate-400">Role:</span>
              <span className="font-bold">{activeRole}</span>
              {isDemoMode && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-800 text-amber-950 dark:text-amber-100 font-bold uppercase tracking-wider">
                  Demo
                </span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#111C2E] rounded-2xl shadow-xl border border-[#E2E8F0] dark:border-[#263449] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    RBAC Role Simulator (Admin)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Test UI &amp; clearance as other roles
                  </div>
                </div>

                <div className="p-1 space-y-0.5">
                  {roles.map(r => {
                    const isSelected = activeRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          setPreviewRole(r === 'Admin' ? null : r);
                          setRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'font-bold text-[#2563EB] dark:text-[#3B82F6] bg-blue-50/80 dark:bg-blue-900/30'
                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{r}</span>
                          {r === 'Admin' && (
                            <span className="text-[9px] px-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono">
                              Primary
                            </span>
                          )}
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#2563EB] dark:text-[#3B82F6]" />}
                      </button>
                    );
                  })}
                </div>

                {isDemoMode && (
                  <div className="p-2 border-t border-slate-100 dark:border-slate-800 mt-1">
                    <button
                      onClick={() => {
                        setPreviewRole(null);
                        setRoleDropdownOpen(false);
                      }}
                      className="w-full py-1.5 text-center text-xs font-bold text-[#DC2626] hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                    >
                      Exit Preview &amp; Restore Admin
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* If non-admin user, show their authenticated role */}
        {actualRole !== 'Admin' && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#0F172A] dark:text-[#F8FAFC] text-xs font-bold border border-slate-200 dark:border-slate-700">
            <Shield className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>{actualRole}</span>
          </div>
        )}

        {/* User Profile Avatar & Dropdown */}
        <div className="relative pl-1">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={userProfile?.email || currentUser?.email || 'User Account'}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#2563EB] to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
              {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
            </div>
            <div className="hidden xl:block text-left pr-1">
              <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-tight truncate max-w-[120px]">
                {userProfile?.name || 'User'}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono leading-tight truncate max-w-[120px]">
                {activeRole}
              </div>
            </div>
            <ChevronDown className="hidden xl:block w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#111C2E] rounded-2xl shadow-xl border border-[#E2E8F0] dark:border-[#263449] py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">{userProfile?.name}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{userProfile?.email}</div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#2563EB] dark:text-[#60A5FA] font-bold">
                    {actualRole}
                  </span>
                  <span className="text-[10px] text-[#16A34A] font-semibold">Active Session</span>
                </div>
              </div>

              <div className="p-1.5">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold text-[#DC2626] hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
