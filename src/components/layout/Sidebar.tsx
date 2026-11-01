import React from 'react';
import {
  LayoutDashboard,
  Users2,
  Building2,
  Contact2,
  Megaphone,
  History,
  Target,
  UserCheck,
  CheckSquare,
  Briefcase,
  GitCommit,
  ShieldAlert,
  ShieldCheck,
  FileCheck2,
  FileText,
  BarChart3,
  Database,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';

interface SidebarProps {
  activeNav: string;
  setActiveNav: (nav: string) => void;
  collapsed: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeNav,
  setActiveNav,
  collapsed,
}) => {
  const { leads, opportunities, tasks, anomalies, consents } = useCRM();

  const hotLeadsCount = leads.filter(l => l.scoreCategory === 'HOT').length;
  const activeTasksCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const activeAnomaliesCount = anomalies.filter(a => a.status === 'DETECTED').length;
  const optedOutCount = consents.filter(c => c.status === 'OPTED_OUT' || c.status === 'WITHDRAWN').length;

  const navSections = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'overview', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'leads', label: 'Leads Management', icon: Users2, badge: hotLeadsCount > 0 ? `${hotLeadsCount} Hot` : undefined, badgeColor: 'bg-rose-100 text-rose-800' },
        { id: 'companies', label: 'Companies', icon: Building2 },
        { id: 'contacts', label: 'Contacts', icon: Contact2 },
        { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
        { id: 'activities', label: 'Activities', icon: History },
      ],
    },
    {
      title: 'INTELLIGENCE & OPS',
      items: [
        { id: 'scoring', label: 'Lead Scoring Engine', icon: Target },
        { id: 'salesReps', label: 'Sales Representatives', icon: UserCheck },
        { id: 'tasks', label: 'Follow-up Tasks', icon: CheckSquare, badge: activeTasksCount > 0 ? `${activeTasksCount}` : undefined, badgeColor: 'bg-amber-100 text-amber-800' },
        { id: 'opportunities', label: 'Opportunities', icon: Briefcase, badge: opportunities.length > 0 ? `${opportunities.length}` : undefined },
        { id: 'stageHistory', label: 'Stage History', icon: GitCommit },
      ],
    },
    {
      title: 'GOVERNANCE & SYSTEM',
      items: [
        { id: 'anomalies', label: 'Anomaly Detection', icon: ShieldAlert, badge: activeAnomaliesCount > 0 ? `${activeAnomaliesCount}` : undefined, badgeColor: 'bg-red-500 text-white' },
        { id: 'consent', label: 'Consent Management', icon: ShieldCheck, badge: optedOutCount > 0 ? `${optedOutCount} Blocked` : undefined, badgeColor: 'bg-slate-700 text-slate-200' },
        { id: 'analytics', label: 'Analytics & Evaluation', icon: BarChart3 },
        { id: 'dataManagement', label: 'Data Management', icon: Database },
        { id: 'validation', label: 'Validation Center', icon: FileCheck2 },
        { id: 'auditLogs', label: 'Audit Logs', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside
      className={`bg-[#0f172a] text-slate-300 border-r border-slate-800 flex flex-col transition-all duration-200 shrink-0 z-30 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Scrollable Nav List */}
      <div className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
        {navSections.map(section => (
          <div key={section.title} className="space-y-1">
            {!collapsed && (
              <div className="px-3 pb-1 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {section.title}
              </div>
            )}
            {section.items.map(item => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveNav(item.id)}
                  title={collapsed ? item.label : undefined}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                    isActive
                      ? 'bg-purple-600/20 text-purple-300 font-semibold border-l-2 border-purple-500'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-purple-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {!collapsed && (
                    <span className="flex-1 text-left truncate">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold ${
                        item.badgeColor || 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500">
          <div className="flex items-center justify-between">
            <span>Deterministic Seed</span>
            <span className="font-mono text-purple-400 text-[10px]">20261022</span>
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5">LEADPULSE Enterprise v1.0</div>
        </div>
      )}
    </aside>
  );
};
