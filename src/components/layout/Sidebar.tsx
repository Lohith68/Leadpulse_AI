import React from 'react';
import {
  LayoutDashboard,
  Building2,
  Contact2,
  Users2,
  Megaphone,
  History,
  UserCheck,
  CheckSquare,
  Briefcase,
  BarChart3,
  Database,
  FileCheck2,
  UserCog,
  ShieldAlert,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Activity,
  Shield,
  Sparkles,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  collapsed: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  setActiveNav,
  collapsed,
  setCollapsed,
}) => {
  const { leads, opportunities, tasks, anomalies } = useCRM();
  const { userProfile, activeRole, actualRole, isDemoMode, canAccessNav, logout } = useAuth();

  const hotLeadsCount = leads.filter(l => l.scoreCategory === 'HOT').length;
  const activeTasksCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const activeAnomaliesCount = anomalies.filter(a => a.status === 'DETECTED').length;

  // Exact navigation item specification from UI/UX redesign prompt
  const allNavItems = [
    { id: 'overview', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'contacts', label: 'Contacts', icon: Contact2 },
    {
      id: 'leads',
      label: activeRole === 'Sales Representative' ? 'My Leads' : 'Leads',
      icon: Users2,
      badge: hotLeadsCount > 0 ? `${hotLeadsCount}` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/30',
    },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
    { id: 'activities', label: 'Activities', icon: History },
    { id: 'salesReps', label: 'Sales Representatives', icon: UserCheck },
    {
      id: 'tasks',
      label: activeRole === 'Sales Representative' ? 'My Tasks' : 'Tasks',
      icon: CheckSquare,
      badge: activeTasksCount > 0 ? `${activeTasksCount}` : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'opportunities',
      label: activeRole === 'Sales Representative' ? 'My Opportunities' : 'Opportunities',
      icon: Briefcase,
      badge: opportunities.length > 0 ? `${opportunities.length}` : undefined,
      badgeColor: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'dataManagement', label: 'Data Generator', icon: Database },
    { id: 'validation', label: 'Data Validation', icon: FileCheck2 },
    { id: 'userManagement', label: 'User Management', icon: UserCog, adminOnly: true },
    { id: 'anomalies', label: 'Security & Anomalies', icon: ShieldAlert, badge: activeAnomaliesCount > 0 ? `${activeAnomaliesCount}` : undefined, badgeColor: 'bg-red-500 text-white' },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filter items by role authorization
  const authorizedItems = allNavItems.filter(item => {
    if (item.adminOnly && activeRole !== 'Admin') return false;
    return canAccessNav(item.id);
  });

  return (
    <aside
      className={`bg-[#0B1428] dark:bg-[#070D18] text-slate-300 border-r border-slate-800/80 flex flex-col transition-all duration-300 shrink-0 z-30 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80">
        <div
          onClick={() => setActiveNav('overview')}
          className="flex items-center gap-3 cursor-pointer group overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-600/30 group-hover:scale-105 transition-transform shrink-0">
            <Activity className="w-5 h-5 text-teal-300 animate-pulse" />
          </div>
          {!collapsed && (
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-extrabold tracking-tight text-white font-sans">
                  LEADPULSE
                </span>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-400 border border-blue-500/30">
                  AI
                </span>
              </div>
              <span className="text-[10px] font-medium text-slate-400 block tracking-wide">
                Team Agentrax
              </span>
            </div>
          )}
        </div>

        {setCollapsed && !collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            title="Collapse sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Role Badge Indicator */}
      {!collapsed && (
        <div className="px-4 py-2.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between">
          <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Clearance Tier
          </span>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isDemoMode
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}
          >
            {activeRole}
            {isDemoMode && ' (Preview)'}
          </span>
        </div>
      )}

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
        {authorizedItems.map(item => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 group relative cursor-pointer ${
                isActive
                  ? 'bg-[#2563EB] text-white font-semibold shadow-md shadow-blue-600/25'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold leading-none ${
                    isActive ? 'bg-white/20 text-white' : item.badgeColor
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* User Profile & Logout at Bottom */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
            {userProfile?.name ? userProfile.name[0].toUpperCase() : 'U'}
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-white truncate leading-tight">
                {userProfile?.name || 'CRM User'}
              </div>
              <div className="text-[10px] font-medium text-slate-400 truncate leading-tight mt-0.5">
                {actualRole}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition-colors cursor-pointer shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
