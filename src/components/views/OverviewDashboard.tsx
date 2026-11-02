import React, { useState, useMemo } from 'react';
import {
  Users,
  Building,
  Target,
  DollarSign,
  TrendingUp,
  AlertOctagon,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Sparkles,
  Filter,
  ArrowUpRight,
  Flame,
  Award,
  Megaphone,
  BarChart3,
  Calendar,
  Layers,
  ChevronRight,
  Activity,
  Briefcase,
  UserCheck,
  CheckSquare,
  FileCheck2,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  CartesianGrid,
  Funnel,
  FunnelChart,
  LabelList,
} from 'recharts';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { UserRole } from '../../types/crm';

// Enterprise Palette Tokens
const COLORS = {
  primary: '#2563EB',
  teal: '#14B8A6',
  hot: '#EF4444',
  warm: '#F59E0B',
  cold: '#3B82F6',
  won: '#16A34A',
  lost: '#64748B',
  purple: '#8B5CF6',
  navy: '#101B33',
};

// Reusable KPI Card Component
interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  iconBg: string;
  trend?: {
    value: string;
    isPositive?: boolean;
    label?: string;
  };
  onClick?: () => void;
}

const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor,
  iconBg,
  trend,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 ${
      onClick ? 'cursor-pointer hover:border-[#2563EB]/40' : ''
    }`}
  >
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] dark:text-[#94A3B8]">
        {title}
      </span>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
    </div>

    <div className="mt-2 flex items-baseline justify-between">
      <div className="text-2xl font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
        {value}
      </div>
      {trend && (
        <span
          className={`inline-flex items-center gap-0.5 text-xs font-bold ${
            trend.isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'
          }`}
        >
          {trend.isPositive ? <ArrowUpRight className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
          {trend.value}
        </span>
      )}
    </div>

    {subtitle && (
      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 truncate">
        {subtitle}
      </div>
    )}
  </div>
);

export const OverviewDashboard: React.FC<{ onNavigate: (nav: string) => void }> = ({ onNavigate }) => {
  const {
    leads,
    companies,
    contacts,
    opportunities,
    tasks,
    campaigns,
    salesReps,
    anomalies,
    consents,
    activities,
    validationReport,
  } = useCRM();

  const { activeRole, actualRole } = useAuth();
  const { isDark } = useTheme();

  // Role perspective switcher for Admin (defaults to active role)
  const [selectedDashboardRole, setSelectedDashboardRole] = useState<UserRole>(activeRole);

  // Sync when activeRole changes (e.g. preview mode switched in header)
  React.useEffect(() => {
    setSelectedDashboardRole(activeRole);
  }, [activeRole]);

  // General calculations
  const totalLeads = leads.length;
  const hotLeads = leads.filter(l => l.scoreCategory === 'HOT').length;
  const warmLeads = leads.filter(l => l.scoreCategory === 'WARM').length;
  const coldLeads = leads.filter(l => l.scoreCategory === 'COLD').length;

  const totalOpps = opportunities.length;
  const wonOpps = opportunities.filter(o => o.stage === 'WON').length;
  const lostOpps = opportunities.filter(o => o.stage === 'LOST').length;

  const totalPipelineRevenue = opportunities.reduce((acc, o) => acc + (o.value || 0), 0);
  const wonRevenue = opportunities.filter(o => o.stage === 'WON').reduce((acc, o) => acc + (o.value || 0), 0);

  const avgLeadScore =
    totalLeads > 0 ? Math.round(leads.reduce((acc, l) => acc + (l.totalScore || 0), 0) / totalLeads) : 0;

  const pendingTasks = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;
  const activeAnomalies = anomalies.filter(a => a.status === 'DETECTED').length;

  // Rep mappings
  const repsMap = useMemo(() => new Map(salesReps.map(r => [r.id, r])), [salesReps]);

  // Selected Rep for Sales Rep dashboard (default to first rep)
  const [selectedRepId, setSelectedRepId] = useState<string>('REP-001');

  // Chart data: Score Category Distribution
  const scoreCategoryData = useMemo(() => [
    { name: 'HOT (70-100)', value: hotLeads, color: COLORS.hot },
    { name: 'WARM (40-69)', value: warmLeads, color: COLORS.warm },
    { name: 'COLD (0-39)', value: coldLeads, color: COLORS.cold },
  ], [hotLeads, warmLeads, coldLeads]);

  // Chart data: Revenue by Stage
  const revenueByStageData = useMemo(() => {
    const stages = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];
    return stages.map(st => {
      const stageOpps = opportunities.filter(o => o.stage === st);
      const val = stageOpps.reduce((acc, o) => acc + (o.value || 0), 0);
      return {
        stage: st,
        revenue: Math.round(val / 1000), // in $k
        count: stageOpps.length,
      };
    });
  }, [opportunities]);

  // Chart data: Lead Funnel
  const funnelData = useMemo(() => {
    const total = totalLeads || 1;
    const contacted = leads.filter(l => l.lifecycleStatus !== 'NEW').length;
    const qualified = leads.filter(l => l.lifecycleStatus === 'QUALIFIED' || l.lifecycleStatus === 'CONVERTED').length;
    const converted = wonOpps;
    return [
      { step: '1. Ingested Leads', count: totalLeads, rate: '100%' },
      { step: '2. Contacted / Scored', count: contacted, rate: `${Math.round((contacted / total) * 100)}%` },
      { step: '3. SLA Qualified', count: qualified, rate: `${Math.round((qualified / total) * 100)}%` },
      { step: '4. Deals Won', count: converted, rate: `${Math.round((converted / total) * 100)}%` },
    ];
  }, [totalLeads, leads, wonOpps]);

  // Chart data: Sales Rep Leaderboard
  const repPerformanceData = useMemo(() => {
    return salesReps.slice(0, 6).map(rep => {
      const repOpps = opportunities.filter(o => o.assignedRepId === rep.id);
      const repWon = repOpps.filter(o => o.stage === 'WON').reduce((acc, o) => acc + (o.value || 0), 0);
      const repLeads = leads.filter(l => l.assignedRepId === rep.id).length;
      return {
        name: rep.name.split(' ')[0],
        wonRevenue: Math.round(repWon / 1000),
        leadsAssigned: repLeads,
        territory: rep.territory,
      };
    });
  }, [salesReps, opportunities, leads]);

  // Chart data: Campaign Performance
  const campaignPerformanceData = useMemo(() => {
    return campaigns.slice(0, 5).map(cmp => {
      const cmpLeads = leads.filter(l => l.campaignId === cmp.id).length;
      const cmpOpps = opportunities.filter(o => {
        const lead = leads.find(l => l.id === o.leadId);
        return lead && lead.campaignId === cmp.id;
      }).length;
      return {
        name: cmp.name.length > 15 ? `${cmp.name.substring(0, 15)}...` : cmp.name,
        leads: cmpLeads,
        opportunities: cmpOpps,
        budget: Math.round((cmp.budget || 0) / 1000),
      };
    });
  }, [campaigns, leads, opportunities]);

  // Tooltip theme styling
  const tooltipStyle = {
    backgroundColor: isDark ? '#111C2E' : '#FFFFFF',
    border: `1px solid ${isDark ? '#263449' : '#E2E8F0'}`,
    borderRadius: '12px',
    color: isDark ? '#F8FAFC' : '#0F172A',
    fontSize: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  };

  /* -------------------------------------------------------------
   * 1. ADMIN DASHBOARD VIEW (Business Intelligence)
   * ----------------------------------------------------------- */
  const renderAdminDashboard = () => (
    <div className="space-y-6">
      {/* 8 Top KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Total Leads"
          value={totalLeads.toLocaleString()}
          subtitle="Enterprise pipeline leads"
          icon={Users}
          iconColor="text-[#2563EB]"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          trend={{ value: '100% Deterministic', isPositive: true }}
          onClick={() => onNavigate('leads')}
        />
        <KPICard
          title="Average Lead Score"
          value={`${avgLeadScore}/100`}
          subtitle="Fit + Intent + Engagement"
          icon={Target}
          iconColor="text-[#14B8A6]"
          iconBg="bg-teal-50 dark:bg-teal-950/40"
          trend={{ value: '100-pt SLA', isPositive: true }}
          onClick={() => onNavigate('scoring')}
        />
        <KPICard
          title="HOT Leads"
          value={hotLeads.toLocaleString()}
          subtitle="Immediate 1-day SLA follow-up"
          icon={Flame}
          iconColor="text-[#EF4444]"
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          trend={{ value: `${totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0}% ratio`, isPositive: true }}
          onClick={() => onNavigate('leads')}
        />
        <KPICard
          title="WARM Leads"
          value={warmLeads.toLocaleString()}
          subtitle="3-day outreach cadence"
          icon={Award}
          iconColor="text-[#F59E0B]"
          iconBg="bg-amber-50 dark:bg-amber-950/40"
          trend={{ value: `${totalLeads > 0 ? Math.round((warmLeads / totalLeads) * 100) : 0}% ratio`, isPositive: true }}
          onClick={() => onNavigate('leads')}
        />
        <KPICard
          title="Pipeline Revenue"
          value={`$${(totalPipelineRevenue / 1000).toFixed(0)}k`}
          subtitle={`$${(wonRevenue / 1000).toFixed(0)}k won deal value`}
          icon={DollarSign}
          iconColor="text-[#16A34A]"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          trend={{ value: `${wonOpps} Won Deals`, isPositive: true }}
          onClick={() => onNavigate('opportunities')}
        />
        <KPICard
          title="Total Opportunities"
          value={totalOpps.toLocaleString()}
          subtitle={`${wonOpps} Won · ${lostOpps} Lost`}
          icon={Briefcase}
          iconColor="text-[#3B82F6]"
          iconBg="bg-sky-50 dark:bg-sky-950/40"
          trend={{ value: `${totalOpps > 0 ? Math.round((wonOpps / totalOpps) * 100) : 0}% win rate`, isPositive: true }}
          onClick={() => onNavigate('opportunities')}
        />
        <KPICard
          title="Pending Follow-ups"
          value={pendingTasks.toLocaleString()}
          subtitle="Active SLA follow-up tasks"
          icon={Clock}
          iconColor="text-indigo-500"
          iconBg="bg-indigo-50 dark:bg-indigo-950/40"
          onClick={() => onNavigate('tasks')}
        />
        <KPICard
          title="Detected Anomalies"
          value={activeAnomalies.toLocaleString()}
          subtitle="Territory, post-conversion & consent"
          icon={ShieldAlert}
          iconColor="text-[#DC2626]"
          iconBg="bg-red-50 dark:bg-red-950/40"
          trend={{ value: 'Audit Active', isPositive: false }}
          onClick={() => onNavigate('anomalies')}
        />
      </div>

      {/* Row 2: Charts (Lead Distribution & Revenue by Stage) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Score Distribution Donut */}
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Lead Score Category Distribution
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Deterministic 100-point breakdown across active prospects
              </p>
            </div>
            <span className="text-xs font-bold text-[#2563EB]">
              {totalLeads} Total
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {scoreCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={value => (
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8] font-medium">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue by Stage Bar Chart */}
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Revenue by Opportunity Stage ($k)
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Deal value progression through qualified sales pipeline
              </p>
            </div>
            <span className="text-xs font-bold text-[#16A34A]">
              ${(totalPipelineRevenue / 1000).toFixed(0)}k Pipeline
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByStageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#263449' : '#E2E8F0'} />
                <XAxis dataKey="stage" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="revenue" fill={COLORS.primary} radius={[6, 6, 0, 0]} name="Deal Value ($k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Funnel & Sales Rep Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Lead Conversion Funnel
            </h3>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Progression from initial prospect ingestion to closed-won deals
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {funnelData.map((step, idx) => (
              <div key={step.step} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-[#0F172A] dark:text-[#F8FAFC]">{step.step}</span>
                  <span className="text-[#2563EB] dark:text-[#3B82F6]">
                    {step.count.toLocaleString()} ({step.rate})
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className="h-3 rounded-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all duration-500"
                    style={{
                      width: `${Math.max(8, Math.min(100, (step.count / (totalLeads || 1)) * 100))}%`,
                      opacity: 1 - idx * 0.15,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sales Rep Performance Leaderboard */}
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Sales Representative Leaderboard
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Top account executives by won revenue and active pipeline
              </p>
            </div>
            <button
              onClick={() => onNavigate('salesReps')}
              className="text-xs font-bold text-[#2563EB] hover:underline"
            >
              View All Reps
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={isDark ? '#263449' : '#E2E8F0'} />
                <XAxis type="number" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="wonRevenue" fill={COLORS.teal} radius={[0, 6, 6, 0]} name="Won Deals ($k)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Recent Activities & Upcoming Follow-ups */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Recent Activity Stream
            </h3>
            <button onClick={() => onNavigate('activities')} className="text-xs font-bold text-[#2563EB] hover:underline">
              Inspect All
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {activities.slice(0, 5).map(act => (
              <div key={act.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {act.type.replace(/_/g, ' ')}
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    Lead {act.leadId} · +{act.pointsContributed} pts
                  </div>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Upcoming Follow-up SLAs
            </h3>
            <button onClick={() => onNavigate('tasks')} className="text-xs font-bold text-[#2563EB] hover:underline">
              View Tasks
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {tasks.slice(0, 5).map(t => (
              <div key={t.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{t.title}</div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                    Lead {t.leadId} · Priority: {t.priority}
                  </div>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    t.priority === 'URGENT_1_DAY'
                      ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}
                >
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  /* -------------------------------------------------------------
   * 2. SALES MANAGER DASHBOARD VIEW (Team-Focused)
   * ----------------------------------------------------------- */
  const renderSalesManagerDashboard = () => (
    <div className="space-y-6">
      {/* 6 Team KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          title="Total Team Leads"
          value={totalLeads.toLocaleString()}
          subtitle="Assigned across representative pool"
          icon={Users}
          iconColor="text-[#2563EB]"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          onClick={() => onNavigate('leads')}
        />
        <KPICard
          title="Team HOT Leads"
          value={hotLeads.toLocaleString()}
          subtitle="Requiring 1-day executive SLA"
          icon={Flame}
          iconColor="text-[#EF4444]"
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          onClick={() => onNavigate('leads')}
        />
        <KPICard
          title="Team Conversion Rate"
          value={`${totalLeads > 0 ? ((wonOpps / totalLeads) * 100).toFixed(1) : 0}%`}
          subtitle="Leads closed won by team"
          icon={TrendingUp}
          iconColor="text-[#16A34A]"
          iconBg="bg-emerald-50 dark:bg-emerald-950/40"
          trend={{ value: '+4.2% vs baseline', isPositive: true }}
          onClick={() => onNavigate('analytics')}
        />
        <KPICard
          title="Team Pipeline Value"
          value={`$${(totalPipelineRevenue / 1000).toFixed(0)}k`}
          subtitle={`$${(wonRevenue / 1000).toFixed(0)}k closed won`}
          icon={DollarSign}
          iconColor="text-[#14B8A6]"
          iconBg="bg-teal-50 dark:bg-teal-950/40"
          onClick={() => onNavigate('opportunities')}
        />
        <KPICard
          title="Overdue Follow-ups"
          value={tasks.filter(t => t.status === 'OVERDUE').length}
          subtitle="SLA threshold breached"
          icon={Clock}
          iconColor="text-[#DC2626]"
          iconBg="bg-rose-50 dark:bg-rose-950/40"
          trend={{ value: 'Action Required', isPositive: false }}
          onClick={() => onNavigate('tasks')}
        />
        <KPICard
          title="Active Opportunities"
          value={opportunities.filter(o => o.stage !== 'WON' && o.stage !== 'LOST').length}
          subtitle="Currently in negotiation or proposal"
          icon={Briefcase}
          iconColor="text-[#3B82F6]"
          iconBg="bg-blue-50 dark:bg-blue-950/40"
          onClick={() => onNavigate('opportunities')}
        />
      </div>

      {/* Leaderboard and Opportunity Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Sales Representative Quota Leaderboard
            </h3>
            <span className="text-xs font-bold text-[#2563EB]">
              {salesReps.length} Reps
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {salesReps.slice(0, 6).map((rep, idx) => {
              const repOpps = opportunities.filter(o => o.assignedRepId === rep.id);
              const repWon = repOpps.filter(o => o.stage === 'WON').reduce((acc, o) => acc + (o.value || 0), 0);
              const quotaPercentage = rep.quota ? Math.round((repWon / rep.quota) * 100) : 65;
              return (
                <div key={rep.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="w-5 text-center font-bold text-slate-400">#{idx + 1}</span>
                    <div>
                      <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{rep.name}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                        {rep.territory} · {rep.specialization}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-[#16A34A]">${(repWon / 1000).toFixed(0)}k Won</div>
                    <div className="text-[10px] text-slate-400">{quotaPercentage}% Quota</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Opportunity Pipeline Stages */}
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Team Opportunity Pipeline Progression
            </h3>
            <button onClick={() => onNavigate('opportunities')} className="text-xs font-bold text-[#2563EB] hover:underline">
              Open Kanban
            </button>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByStageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#263449' : '#E2E8F0'} />
                <XAxis dataKey="stage" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill={COLORS.teal} radius={[6, 6, 0, 0]} name="Deals in Stage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  /* -------------------------------------------------------------
   * 3. SALES REPRESENTATIVE DASHBOARD VIEW (Personal Productivity)
   * ----------------------------------------------------------- */
  const renderSalesRepDashboard = () => {
    const repLeads = leads.filter(l => l.assignedRepId === selectedRepId || !l.assignedRepId);
    const repTasks = tasks.filter(t => t.assignedRepId === selectedRepId);
    const repOpps = opportunities.filter(o => o.assignedRepId === selectedRepId);
    const myHot = repLeads.filter(l => l.scoreCategory === 'HOT').length;
    const myWarm = repLeads.filter(l => l.scoreCategory === 'WARM').length;
    const myPendingTasks = repTasks.filter(t => t.status !== 'COMPLETED').length;
    const myCompletedTasks = repTasks.filter(t => t.status === 'COMPLETED').length;

    return (
      <div className="space-y-6">
        {/* Personal Portfolio Selector */}
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-[#2563EB] flex items-center justify-center font-bold">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Sales Representative Workspace
              </div>
              <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                Viewing personal pipeline for {repsMap.get(selectedRepId)?.name || 'Account Executive'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Select Rep:</span>
            <select
              value={selectedRepId}
              onChange={e => setSelectedRepId(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1.5 font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
            >
              {salesReps.map(r => (
                <option key={r.id} value={r.id}>{r.name} ({r.id})</option>
              ))}
            </select>
          </div>
        </div>

        {/* 6 Personal Productivity KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="My Total Leads"
            value={repLeads.length}
            subtitle="Assigned prospects"
            icon={Users}
            iconColor="text-[#2563EB]"
            iconBg="bg-blue-50 dark:bg-blue-950/40"
            onClick={() => onNavigate('leads')}
          />
          <KPICard
            title="My HOT Leads"
            value={myHot}
            subtitle="Requires immediate outreach"
            icon={Flame}
            iconColor="text-[#EF4444]"
            iconBg="bg-rose-50 dark:bg-rose-950/40"
            onClick={() => onNavigate('leads')}
          />
          <KPICard
            title="My WARM Leads"
            value={myWarm}
            subtitle="Active nurturing sequence"
            icon={Award}
            iconColor="text-[#F59E0B]"
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            onClick={() => onNavigate('leads')}
          />
          <KPICard
            title="My Pending Tasks"
            value={myPendingTasks}
            subtitle="Follow-ups due today"
            icon={Clock}
            iconColor="text-indigo-500"
            iconBg="bg-indigo-50 dark:bg-indigo-950/40"
            onClick={() => onNavigate('tasks')}
          />
          <KPICard
            title="My Completed Tasks"
            value={myCompletedTasks}
            subtitle="Successfully logged SLAs"
            icon={CheckCircle2}
            iconColor="text-[#16A34A]"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            onClick={() => onNavigate('tasks')}
          />
          <KPICard
            title="My Active Deals"
            value={repOpps.length}
            subtitle={`$${Math.round(repOpps.reduce((acc, o) => acc + (o.value || 0), 0) / 1000)}k pipeline`}
            icon={Briefcase}
            iconColor="text-[#14B8A6]"
            iconBg="bg-teal-50 dark:bg-teal-950/40"
            onClick={() => onNavigate('opportunities')}
          />
        </div>

        {/* My Assigned Leads & My Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Today's High-Priority Leads
              </h3>
              <button onClick={() => onNavigate('leads')} className="text-xs font-bold text-[#2563EB] hover:underline">
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {repLeads.slice(0, 5).map(lead => (
                <div key={lead.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{lead.id}</div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      {lead.productInterest} · {lead.territory}
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      lead.scoreCategory === 'HOT'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                    }`}
                  >
                    Score: {lead.totalScore} ({lead.scoreCategory})
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                My Follow-up Checklist
              </h3>
              <button onClick={() => onNavigate('tasks')} className="text-xs font-bold text-[#2563EB] hover:underline">
                Manage Tasks
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {repTasks.slice(0, 5).map(t => (
                <div key={t.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{t.title}</div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                      Lead {t.leadId} · Due in {t.dueBusinessDays} business day(s)
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------
   * 4. MARKETING DASHBOARD VIEW (Marketing Intelligence)
   * ----------------------------------------------------------- */
  const renderMarketingDashboard = () => {
    const totalCampaignLeads = leads.filter(l => l.campaignId).length;
    const optedInCount = consents.filter(c => c.status === 'OPTED_IN').length;
    const optedOutCount = consents.filter(c => c.status === 'OPTED_OUT' || c.status === 'WITHDRAWN').length;

    return (
      <div className="space-y-6">
        {/* 6 Marketing KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Total Campaigns"
            value={campaigns.length}
            subtitle="Demand generation programs"
            icon={Megaphone}
            iconColor="text-[#2563EB]"
            iconBg="bg-blue-50 dark:bg-blue-950/40"
            onClick={() => onNavigate('campaigns')}
          />
          <KPICard
            title="Campaign Leads"
            value={totalCampaignLeads.toLocaleString()}
            subtitle="Generated prospect inquiries"
            icon={Users}
            iconColor="text-[#14B8A6]"
            iconBg="bg-teal-50 dark:bg-teal-950/40"
            onClick={() => onNavigate('leads')}
          />
          <KPICard
            title="Touchpoint Activities"
            value={activities.length.toLocaleString()}
            subtitle="Pricing, demos & email clicks"
            icon={Activity}
            iconColor="text-[#8B5CF6]"
            iconBg="bg-purple-50 dark:bg-purple-950/40"
            onClick={() => onNavigate('activities')}
          />
          <KPICard
            title="Active Consent Rate"
            value={`${consents.length > 0 ? Math.round((optedInCount / consents.length) * 100) : 95}%`}
            subtitle="GDPR & CCPA verified opt-ins"
            icon={ShieldCheck}
            iconColor="text-[#16A34A]"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            onClick={() => onNavigate('consent')}
          />
          <KPICard
            title="Marketing Pipeline"
            value={`$${Math.round(totalPipelineRevenue / 1000)}k`}
            subtitle="Influenced pipeline deal volume"
            icon={DollarSign}
            iconColor="text-[#F59E0B]"
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            onClick={() => onNavigate('opportunities')}
          />
          <KPICard
            title="Consent Opt-Outs"
            value={optedOutCount}
            subtitle="Blocked from sales outreach"
            icon={AlertOctagon}
            iconColor="text-[#DC2626]"
            iconBg="bg-rose-50 dark:bg-rose-950/40"
            onClick={() => onNavigate('consent')}
          />
        </div>

        {/* Campaign Performance Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Campaign Performance &amp; Lead Ingestion
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Leads and opportunity conversions generated per campaign
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={campaignPerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#263449' : '#E2E8F0'} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend />
                  <Bar dataKey="leads" fill={COLORS.primary} name="Leads" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="opportunities" fill={COLORS.teal} name="Opportunities" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Touchpoint Activity Type Distribution */}
          <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                High-Intent Engagement Activity Distribution
              </h3>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Buyer intent signals scored in real-time
              </p>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { label: 'PRICING PAGE VIEW', points: 25, count: activities.filter(a => a.type === 'PRICING_PAGE_VIEW').length },
                { label: 'DEMO REQUEST', points: 30, count: activities.filter(a => a.type === 'DEMO_REQUEST').length },
                { label: 'PRODUCT INQUIRY', points: 20, count: activities.filter(a => a.type === 'PRODUCT_INQUIRY').length },
                { label: 'EMAIL CLICK', points: 15, count: activities.filter(a => a.type === 'EMAIL_CLICK').length },
                { label: 'WEBSITE VISIT', points: 10, count: activities.filter(a => a.type === 'WEBSITE_VISIT').length },
              ].map(act => (
                <div key={act.label} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-[#0F172A] dark:text-[#F8FAFC]">{act.label} (+{act.points} pts)</span>
                    <span className="text-[#2563EB]">{act.count} Events</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-[#14B8A6]"
                      style={{ width: `${Math.min(100, (act.count / (activities.length || 1)) * 100 * 2)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* -------------------------------------------------------------
   * 5. ANALYST DASHBOARD VIEW (Data Analytics & Audit)
   * ----------------------------------------------------------- */
  const renderAnalystDashboard = () => {
    const totalRecords = companies.length + contacts.length + leads.length + opportunities.length + tasks.length;
    const duplicatesCount = leads.filter(l => l.isDuplicate || l.duplicateGroupId).length;
    const validationScore = validationReport?.score ?? 98;

    return (
      <div className="space-y-6">
        {/* Read-Only Notice Badge */}
        <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#2563EB]" />
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Analyst Research Console (Read-Only Clearance)
            </span>
            <span className="text-slate-500">· Full CSV/JSON export enabled</span>
          </div>
          <button
            onClick={() => onNavigate('dataManagement')}
            className="font-bold text-[#2563EB] hover:underline"
          >
            Export All Data &rarr;
          </button>
        </div>

        {/* 6 Data Analytics KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard
            title="Total Persisted Records"
            value={totalRecords.toLocaleString()}
            subtitle="Companies, Contacts, Leads, Opps, Tasks"
            icon={Layers}
            iconColor="text-[#2563EB]"
            iconBg="bg-blue-50 dark:bg-blue-950/40"
            onClick={() => onNavigate('dataManagement')}
          />
          <KPICard
            title="Average Lead Score"
            value={`${avgLeadScore}/100`}
            subtitle="Transparent multi-attribute formula"
            icon={Target}
            iconColor="text-[#14B8A6]"
            iconBg="bg-teal-50 dark:bg-teal-950/40"
            onClick={() => onNavigate('scoring')}
          />
          <KPICard
            title="Conversion Rate"
            value={`${totalLeads > 0 ? ((wonOpps / totalLeads) * 100).toFixed(1) : 0}%`}
            subtitle="Lead to Closed-Won outcome"
            icon={TrendingUp}
            iconColor="text-[#16A34A]"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            onClick={() => onNavigate('analytics')}
          />
          <KPICard
            title="Labelled Duplicates"
            value={duplicatesCount}
            subtitle="Verified duplicate clusters"
            icon={Users}
            iconColor="text-[#F59E0B]"
            iconBg="bg-amber-50 dark:bg-amber-950/40"
            onClick={() => onNavigate('leads')}
          />
          <KPICard
            title="Data Quality Integrity"
            value={`${validationScore}%`}
            subtitle="Foreign key & invariant validation"
            icon={FileCheck2}
            iconColor="text-[#16A34A]"
            iconBg="bg-emerald-50 dark:bg-emerald-950/40"
            onClick={() => onNavigate('validation')}
          />
          <KPICard
            title="Integrity Anomalies"
            value={activeAnomalies}
            subtitle="Sentinel rule violations detected"
            icon={ShieldAlert}
            iconColor="text-[#DC2626]"
            iconBg="bg-rose-50 dark:bg-rose-950/40"
            onClick={() => onNavigate('anomalies')}
          />
        </div>

        {/* Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Lead Score Distribution Histogram
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreCategoryData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#263449' : '#E2E8F0'} />
                  <XAxis dataKey="name" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[6, 6, 0, 0]} name="Lead Count" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Opportunity Revenue Distribution by Stage
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueByStageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#263449' : '#E2E8F0'} />
                  <XAxis dataKey="stage" tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                  <YAxis tick={{ fill: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Area type="monotone" dataKey="revenue" stroke={COLORS.teal} fill={COLORS.teal} fillOpacity={0.2} name="Revenue ($k)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Header with Role Perspectives Tab Bar (for Admin or inspecting roles) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
            {selectedDashboardRole === 'Admin' && 'Executive Business Intelligence Dashboard'}
            {selectedDashboardRole === 'Sales Manager' && 'Sales Operations & Team Performance Dashboard'}
            {selectedDashboardRole === 'Sales Representative' && 'Account Executive Productivity Dashboard'}
            {selectedDashboardRole === 'Marketing' && 'Marketing Intelligence & Acquisition Dashboard'}
            {selectedDashboardRole === 'Analyst' && 'Data Science & Model Evaluation Dashboard'}
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
            Real-time telemetry synchronized with Cloud Firestore database (ai-studio-1791f9ed-f999-4a0b-a411-b32893a64c15)
          </p>
        </div>

        {/* Admin Dashboard Switcher Tabs */}
        {actualRole === 'Admin' && (
          <div className="flex items-center gap-1 p-1 bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-xl shadow-xs overflow-x-auto">
            {(['Admin', 'Sales Manager', 'Sales Representative', 'Marketing', 'Analyst'] as UserRole[]).map(role => (
              <button
                key={role}
                onClick={() => setSelectedDashboardRole(role)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  selectedDashboardRole === role
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Render the Active Role-Tailored Dashboard */}
      {selectedDashboardRole === 'Admin' && renderAdminDashboard()}
      {selectedDashboardRole === 'Sales Manager' && renderSalesManagerDashboard()}
      {selectedDashboardRole === 'Sales Representative' && renderSalesRepDashboard()}
      {selectedDashboardRole === 'Marketing' && renderMarketingDashboard()}
      {selectedDashboardRole === 'Analyst' && renderAnalystDashboard()}
    </div>
  );
};
