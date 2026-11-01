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
} from 'recharts';
import { useCRM } from '../../context/CRMContext';
import { Territory } from '../../types/crm';
import { Badge } from '../common/Badge';

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
    isSeeding,
    seedDatabase,
  } = useCRM();

  const [selectedTerritory, setSelectedTerritory] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('ALL_TIME');

  // Filter leads and opps by territory
  const filteredLeads = useMemo(() => {
    if (selectedTerritory === 'ALL') return leads;
    return leads.filter(l => l.territory === selectedTerritory);
  }, [leads, selectedTerritory]);

  const filteredOpportunities = useMemo(() => {
    if (selectedTerritory === 'ALL') return opportunities;
    const territoryLeadIds = new Set(filteredLeads.map(l => l.id));
    return opportunities.filter(o => territoryLeadIds.has(o.leadId));
  }, [opportunities, filteredLeads, selectedTerritory]);

  // Calculated Metrics from real Firestore data
  const totalLeads = filteredLeads.length;
  const hotLeads = filteredLeads.filter(l => l.scoreCategory === 'HOT').length;
  const warmLeads = filteredLeads.filter(l => l.scoreCategory === 'WARM').length;
  const coldLeads = filteredLeads.filter(l => l.scoreCategory === 'COLD').length;

  const totalOpps = filteredOpportunities.length;
  const wonOpps = filteredOpportunities.filter(o => o.stage === 'WON').length;
  const lostOpps = filteredOpportunities.filter(o => o.stage === 'LOST').length;

  const conversionRate = totalLeads > 0 ? ((wonOpps / totalLeads) * 100).toFixed(1) : '0.0';
  const leadToOppRate = totalLeads > 0 ? ((totalOpps / totalLeads) * 100).toFixed(1) : '0.0';

  const avgLeadScore =
    totalLeads > 0
      ? Math.round(filteredLeads.reduce((acc, l) => acc + (l.totalScore || 0), 0) / totalLeads)
      : 0;

  const totalPipelineRevenue = filteredOpportunities.reduce((acc, o) => acc + (o.value || 0), 0);
  const wonPipelineRevenue = filteredOpportunities
    .filter(o => o.stage === 'WON')
    .reduce((acc, o) => acc + (o.value || 0), 0);

  // Task Completion Rate & Overdue
  const now = new Date().getTime();
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED').length;
  const overdueTasks = tasks.filter(
    t => t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate).getTime() < now
  ).length;
  const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

  // Consent Violations & Anomalies
  const activeAnomalies = anomalies.filter(a => a.status === 'DETECTED').length;
  const consentViolations = anomalies.filter(a => a.type === 'OPTED_OUT_LEAD_CONTACTED').length;
  const duplicateLeadsCount = leads.filter(l => l.isDuplicate || l.duplicateGroupId).length;

  // Chart 1: Score Category Distribution
  const scoreCategoryData = [
    { name: 'HOT (80-100)', value: hotLeads, color: '#e11d48' },
    { name: 'WARM (50-79)', value: warmLeads, color: '#d97706' },
    { name: 'COLD (0-49)', value: coldLeads, color: '#64748b' },
  ];

  // Chart 2: Conversion Funnel Data
  const contactedLeads = filteredLeads.filter(
    l => l.lifecycleStatus === 'CONTACTED' || l.lifecycleStatus === 'QUALIFIED' || l.lifecycleStatus === 'CONVERTED'
  ).length;
  const qualifiedLeads = filteredLeads.filter(
    l => l.lifecycleStatus === 'QUALIFIED' || l.lifecycleStatus === 'CONVERTED'
  ).length;

  const funnelData = [
    { stage: 'Total Ingested', count: totalLeads, fill: '#0f172a' },
    { stage: 'Engaged / Contacted', count: contactedLeads, fill: '#334155' },
    { stage: 'Sales Qualified', count: qualifiedLeads, fill: '#6d28d9' },
    { stage: 'Opportunities Created', count: totalOpps, fill: '#7c3aed' },
    { stage: 'Deals Won', count: wonOpps, fill: '#10b981' },
  ];

  // Chart 3: Opportunity Stage Breakdown
  const stageCounts: Record<string, number> = {
    NEW: 0,
    QUALIFIED: 0,
    PROPOSAL: 0,
    NEGOTIATION: 0,
    WON: 0,
    LOST: 0,
  };
  filteredOpportunities.forEach(o => {
    if (stageCounts[o.stage] !== undefined) stageCounts[o.stage]++;
  });

  const opportunityStageData = [
    { stage: 'New', count: stageCounts.NEW },
    { stage: 'Qualified', count: stageCounts.QUALIFIED },
    { stage: 'Proposal', count: stageCounts.PROPOSAL },
    { stage: 'Negotiation', count: stageCounts.NEGOTIATION },
    { stage: 'Closed Won', count: stageCounts.WON },
    { stage: 'Closed Lost', count: stageCounts.LOST },
  ];

  // Chart 4: Territory Performance
  const territoryMap: Record<Territory, { territory: string; leads: number; opportunities: number; won: number }> = {
    'North America': { territory: 'NA', leads: 0, opportunities: 0, won: 0 },
    EMEA: { territory: 'EMEA', leads: 0, opportunities: 0, won: 0 },
    APAC: { territory: 'APAC', leads: 0, opportunities: 0, won: 0 },
    LATAM: { territory: 'LATAM', leads: 0, opportunities: 0, won: 0 },
  };

  leads.forEach(l => {
    if (territoryMap[l.territory]) territoryMap[l.territory].leads++;
  });
  opportunities.forEach(o => {
    const lead = leads.find(l => l.id === o.leadId);
    if (lead && territoryMap[lead.territory]) {
      territoryMap[lead.territory].opportunities++;
      if (o.stage === 'WON') territoryMap[lead.territory].won++;
    }
  });
  const territoryChartData = Object.values(territoryMap);

  // Chart 5: Campaign Efficiency
  const campaignData = campaigns.slice(0, 5).map(c => ({
    name: c.name.length > 20 ? c.name.slice(0, 18) + '...' : c.name,
    leads: c.leadsCount,
    conversions: c.conversionsCount,
  }));

  // Chart 6: Sales Rep Leaderboard
  const repPerformance = salesReps.map(r => ({
    name: r.name.split(' ')[0],
    activeLeads: r.activeLeadsCount,
    pipelineWon: Math.round(r.pipelineWon / 1000), // in $k
  }));

  return (
    <div className="space-y-6">
      {/* Top Banner / Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Executive Intelligence Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time pipeline analytics, lead score distributions, and SLA conversion tracking
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Territory Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-semibold text-slate-500">Territory:</span>
            <select
              value={selectedTerritory}
              onChange={e => setSelectedTerritory(e.target.value)}
              className="bg-transparent font-medium text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Territories</option>
              <option value="North America">North America</option>
              <option value="EMEA">EMEA</option>
              <option value="APAC">APAC</option>
              <option value="LATAM">LATAM</option>
            </select>
          </div>

          {/* Empty State Seed CTA */}
          {totalLeads === 0 && (
            <button
              onClick={() => seedDatabase(200)}
              disabled={isSeeding}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
              {isSeeding ? 'Initializing Benchmark...' : 'Initialize 200 Benchmark Leads'}
            </button>
          )}
        </div>
      </div>

      {/* Row 1: KPI Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Leads</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{totalLeads.toLocaleString()}</span>
            <span className="text-[11px] font-semibold text-emerald-600">Active</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {companies.length} Accounts • {contacts.length} Contacts
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Avg Lead Score</span>
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{avgLeadScore}</span>
            <span className="text-[11px] font-bold text-slate-400">/ 100</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px]">
            <span className="font-bold text-rose-600">{hotLeads} Hot</span>
            <span className="text-slate-300">•</span>
            <span className="font-bold text-amber-600">{warmLeads} Warm</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Pipeline Revenue</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              ${(totalPipelineRevenue / 1000).toFixed(0)}k
            </span>
            <span className="text-[11px] font-semibold text-purple-700">{totalOpps} Deals</span>
          </div>
          <div className="mt-1 text-[11px] text-emerald-600 font-medium">
            ${(wonPipelineRevenue / 1000).toFixed(0)}k Closed Won
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Lead-to-Opp Rate</span>
            <TrendingUp className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{leadToOppRate}%</span>
            <span className="text-[11px] font-medium text-slate-500">{conversionRate}% Won</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-400">
            {wonOpps} Won / {lostOpps} Lost
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Follow-Up SLA</span>
            <CheckCircle2 className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{taskCompletionRate}%</span>
            <span className="text-[11px] font-semibold text-slate-500">{tasks.length} Tasks</span>
          </div>
          <div className="mt-1 text-[11px] text-rose-600 font-semibold">
            {overdueTasks} Overdue Tasks
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">System Integrity</span>
            <ShieldAlert className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">{activeAnomalies}</span>
            <span className="text-[11px] font-bold text-amber-700">Anomalies</span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {consentViolations} Consent • {duplicateLeadsCount} Dups
          </div>
        </div>
      </div>

      {/* Row 2: Charts - Funnel and Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversion Funnel */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sales Conversion Funnel</h2>
              <p className="text-xs text-slate-400">
                Progression from lead ingestion through opportunity qualification & win
              </p>
            </div>
            <button
              onClick={() => onNavigate('leads')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              View Leads <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11 }} width={120} />
                <Tooltip
                  formatter={(val: any) => [`${val} records`, 'Volume']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Score Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="mb-4">
            <h2 className="text-sm font-bold text-slate-900">Lead Score Distribution</h2>
            <p className="text-xs text-slate-400">Classification by transparent 100-point rules</p>
          </div>

          <div className="h-52 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={scoreCategoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {scoreCategoryData.map((entry, index) => (
                    <Cell key={`slice-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`${val} leads`, 'Count']}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
            <div className="bg-rose-50/60 p-2 rounded-lg">
              <div className="text-[10px] font-bold text-rose-600">HOT (80+)</div>
              <div className="text-base font-extrabold text-rose-800">{hotLeads}</div>
            </div>
            <div className="bg-amber-50/60 p-2 rounded-lg">
              <div className="text-[10px] font-bold text-amber-600">WARM (50-79)</div>
              <div className="text-base font-extrabold text-amber-800">{warmLeads}</div>
            </div>
            <div className="bg-slate-50 p-2 rounded-lg">
              <div className="text-[10px] font-bold text-slate-600">COLD (0-49)</div>
              <div className="text-base font-extrabold text-slate-800">{coldLeads}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Pipeline Stages & Territory Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Opportunity Stages */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Opportunities by Stage</h2>
              <p className="text-xs text-slate-400">Active deal distribution across sales lifecycle</p>
            </div>
            <button
              onClick={() => onNavigate('opportunities')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              View Pipeline <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={opportunityStageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="stage" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Territory Performance */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Territory Performance</h2>
              <p className="text-xs text-slate-400">Leads generated vs deals closed by region</p>
            </div>
            <button
              onClick={() => onNavigate('salesReps')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              View Reps <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={territoryChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="territory" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="leads" name="Leads" fill="#64748b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="opportunities" name="Opportunities" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="won" name="Won Deals" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: Campaigns & Rep Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Campaign Effectiveness */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Marketing Campaign Performance</h2>
              <p className="text-xs text-slate-400">Top demand generation initiatives by volume</p>
            </div>
            <button
              onClick={() => onNavigate('campaigns')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              All Campaigns <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={campaignData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip contentStyle={{ borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="leads" name="Leads Ingested" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="conversions" name="Conversions" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Rep Leaderboard */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Sales Representative Leaderboard</h2>
              <p className="text-xs text-slate-400">Active deal assignments and closed-won revenue ($k)</p>
            </div>
            <button
              onClick={() => onNavigate('salesReps')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              Rep Roster <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repPerformance}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(val: any, name: any) => [
                    name === 'pipelineWon' ? `$${val}k` : val,
                    name === 'pipelineWon' ? 'Won Revenue ($k)' : 'Active Leads',
                  ]}
                  contentStyle={{ borderRadius: '8px', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="activeLeads" name="Active Leads" fill="#9333ea" radius={[4, 4, 0, 0]} />
                <Bar dataKey="pipelineWon" name="Won Revenue ($k)" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
