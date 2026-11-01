import React, { useState } from 'react';
import {
  Activity,
  ShieldCheck,
  Database,
  Search,
  Bell,
  Menu,
  ChevronDown,
  Sparkles,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { UserRole } from '../../types/crm';
import { Badge } from '../common/Badge';

interface NavbarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  activeNav: string;
  setActiveNav: (nav: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  setActiveNav,
}) => {
  const {
    currentRole,
    setCurrentRole,
    user,
    signInWithGoogle,
    signOutUser,
    dbConnected,
    connectionStatus,
    leads,
    anomalies,
    isSeeding,
    seedDatabase,
  } = useCRM();

  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const activeAnomaliesCount = anomalies.filter(a => a.status === 'DETECTED').length;

  const roles: UserRole[] = [
    'Admin',
    'Sales Manager',
    'Sales Representative',
    'Marketing',
    'Analyst',
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shadow-xs">
      {/* Left: Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => setActiveNav('overview')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-9 h-9 rounded-lg bg-navy-900 bg-[#0f172a] flex items-center justify-center text-white shadow-xs group-hover:bg-[#1e293b] transition-colors">
            <Activity className="w-5 h-5 text-purple-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-extrabold tracking-tight text-slate-900">
                LEADPULSE
              </span>
              <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                AI
              </span>
            </div>
            <span className="hidden sm:block text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
              Intelligent Lead Scoring CRM
            </span>
          </div>
        </div>
      </div>

      {/* Center: Global Search or Quick Status */}
      <div className="hidden md:flex items-center flex-1 max-w-md mx-6">
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, accounts, contacts, opportunities..."
            className="w-full bg-slate-50 hover:bg-slate-100/70 focus:bg-white text-xs pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 text-slate-900 placeholder:text-slate-400 transition-all"
            onKeyDown={e => {
              if (e.key === 'Enter') {
                setActiveNav('leads');
              }
            }}
          />
        </div>
      </div>

      {/* Right: Status, Role Switcher, Quick Actions */}
      <div className="flex items-center gap-3">
        {/* Empty DB Prompt shortcut */}
        {leads.length === 0 && !isSeeding && (
          <button
            onClick={() => seedDatabase(200)}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-700 hover:bg-purple-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Initialize 200 Benchmark Leads
          </button>
        )}

        {/* Anomaly Badge Shortcut */}
        <button
          onClick={() => setActiveNav('anomalies')}
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          title={`${activeAnomaliesCount} Active Anomalies`}
        >
          <Bell className="w-5 h-5" />
          {activeAnomaliesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
          {activeAnomaliesCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-600" />
          )}
        </button>

        {/* Firestore Online Health indicator */}
        <div
          className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600"
          title={connectionStatus}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              dbConnected ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <span className="font-medium text-[11px]">
            {dbConnected ? 'Firestore Online' : 'Connecting'}
          </span>
        </div>

        {/* Role Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-medium text-slate-800 transition-colors shadow-2xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-purple-700" />
            <span className="hidden sm:inline text-slate-500">Role:</span>
            <span className="font-semibold text-slate-900">{currentRole}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
              <div className="px-3 py-1.5 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Simulate User Role (RBAC)
              </div>
              {roles.map(r => (
                <button
                  key={r}
                  onClick={() => {
                    setCurrentRole(r);
                    setRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                    currentRole === r ? 'font-bold text-purple-800 bg-purple-50/50' : 'text-slate-700'
                  }`}
                >
                  <span>{r}</span>
                  {currentRole === r && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-700" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Firebase Authentication UI */}
        {user ? (
          <div className="flex items-center gap-2 pl-1">
            <div className="w-7 h-7 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-bold shadow-2xs">
              {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </div>
            <button
              onClick={() => signOutUser()}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors"
              title={`Signed in as ${user.email}`}
            >
              Sign out
            </button>
          </div>
        ) : (
          <button
            onClick={() => signInWithGoogle()}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Sign In
          </button>
        )}
      </div>
    </header>
  );
};
