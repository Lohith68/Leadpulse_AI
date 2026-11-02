import React, { useState } from 'react';
import { Target, Sparkles, CheckCircle2, RotateCw, Calculator, HelpCircle, Shield, Award } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { ScoreCategory, CompanySize, Industry, RoleLevel, Territory } from '../../types/crm';
import { Badge } from '../common/Badge';
import { calculateLeadScore } from '../../services/leadScoringEngine';

export const ScoringEngineView: React.FC = () => {
  const { scoreRules, leads, recalculateLeadScoreAction } = useCRM();

  // Interactive Simulator State
  const [simSize, setSimSize] = useState<CompanySize>('1000+');
  const [simIndustry, setSimIndustry] = useState<Industry>('Technology');
  const [simRole, setSimRole] = useState<RoleLevel>('C-Level');
  const [simTerritory, setSimTerritory] = useState<Territory>('North America');

  const [hasPricingView, setHasPricingView] = useState(true);
  const [hasDemoRequest, setHasDemoRequest] = useState(true);
  const [hasProductInquiry, setHasProductInquiry] = useState(false);
  const [hasPurchaseIntent, setHasPurchaseIntent] = useState(false);

  const [hasEmailClick, setHasEmailClick] = useState(true);
  const [websiteVisits, setWebsiteVisits] = useState(4);
  const [hasEventAttendance, setHasEventAttendance] = useState(true);
  const [hasRecentInteraction, setHasRecentInteraction] = useState(true);

  const [isRecalculatingAll, setIsRecalculatingAll] = useState(false);

  // Compute simulation in real-time
  const mockActivities: any[] = [];
  const now = new Date();
  if (hasPricingView) mockActivities.push({ id: 'sim-1', type: 'PRICING_PAGE_VIEW', timestamp: now.toISOString(), pointsContributed: 10 });
  if (hasDemoRequest) mockActivities.push({ id: 'sim-2', type: 'DEMO_REQUEST', timestamp: now.toISOString(), pointsContributed: 15 });
  if (hasProductInquiry) mockActivities.push({ id: 'sim-3', type: 'PRODUCT_INQUIRY', timestamp: now.toISOString(), pointsContributed: 10 });
  if (hasPurchaseIntent) mockActivities.push({ id: 'sim-4', type: 'PURCHASE_INTENT_FORM', timestamp: now.toISOString(), pointsContributed: 5 });
  if (hasEmailClick) mockActivities.push({ id: 'sim-5', type: 'EMAIL_CLICK', timestamp: now.toISOString(), pointsContributed: 10 });
  for (let i = 0; i < websiteVisits; i++) {
    mockActivities.push({ id: `sim-web-${i}`, type: 'WEBSITE_VISIT', timestamp: now.toISOString(), pointsContributed: 5 });
  }
  if (hasEventAttendance) mockActivities.push({ id: 'sim-6', type: 'EVENT_ATTENDANCE', timestamp: now.toISOString(), pointsContributed: 5 });
  if (hasRecentInteraction) mockActivities.push({ id: 'sim-7', type: 'RECENT_INTERACTION', timestamp: now.toISOString(), pointsContributed: 5 });

  const simResult = calculateLeadScore({
    company: {
      id: 'CO-SIM',
      name: 'Simulation Corp',
      domain: 'simcorp.com',
      industry: simIndustry,
      size: simSize,
      employeeCount: 2500,
      annualRevenue: 500000000,
      city: 'San Francisco',
      state: 'CA',
      country: 'USA',
      territory: simTerritory,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    contact: {
      id: 'CON-SIM',
      companyId: 'CO-SIM',
      firstName: 'Alex',
      lastName: 'Mercer',
      email: 'alex@simcorp.com',
      normalizedEmail: 'alex@simcorp.com',
      phone: '+1-555-0199',
      jobTitle: 'Chief Information Officer',
      roleLevel: simRole,
      department: 'IT',
      city: 'San Francisco',
      country: 'USA',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    activities: mockActivities,
  });

  const handleRecalculateAll = async () => {
    setIsRecalculatingAll(true);
    try {
      for (const lead of leads) {
        await recalculateLeadScoreAction(lead.id);
      }
      alert(`Successfully recalculated scores for all ${leads.length} leads.`);
    } catch (e) {
      console.error(e);
    } finally {
      setIsRecalculatingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Lead Scoring Engine
            </h1>
            <Badge variant="teal" size="md">
              100-Point Max Rule Engine
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Fit Score (30) + Intent Score (40) + Engagement Score (30) with strict temporal anti-leakage guards.
          </p>
        </div>

        <button
          onClick={handleRecalculateAll}
          disabled={isRecalculatingAll || leads.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RotateCw className={`w-4 h-4 ${isRecalculatingAll ? 'animate-spin' : ''}`} />
          {isRecalculatingAll ? 'Recalculating...' : 'Recalculate All Lead Scores'}
        </button>
      </div>

      {/* Rules Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Fit Score */}
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">1. Company Fit Score</h2>
            <Badge variant="info">Max 30 Pts</Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Evaluates account size, industry, job title, and geographic territory</p>
          <ul className="text-xs space-y-2 pt-3 border-t border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8]">
            <li className="flex justify-between">
              <span>Company Size (500+ employees):</span>
              <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Industry Match (Tech, Health, Finance):</span>
              <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Job Role (C-Level / VP decision maker):</span>
              <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">5 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Geographic Fit (Target Territories):</span>
              <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">5 pts</span>
            </li>
          </ul>
        </div>

        {/* Intent Score */}
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">2. Purchase Intent Score</h2>
            <Badge variant="purple">Max 40 Pts</Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Active commercial signals indicating purchase readiness</p>
          <ul className="text-xs space-y-2 pt-3 border-t border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8]">
            <li className="flex justify-between">
              <span>Direct Demo Request Submission:</span>
              <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] tabular-nums">15 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Pricing Page In-Depth Visit:</span>
              <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] tabular-nums">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Technical Product Inquiry Form:</span>
              <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] tabular-nums">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Purchase Intent / Quote Request:</span>
              <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] tabular-nums">5 pts</span>
            </li>
          </ul>
        </div>

        {/* Engagement Score */}
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">3. Engagement Score</h2>
            <Badge variant="teal">Max 30 Pts</Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Marketing interactions, email CTR, web sessions, and recency</p>
          <ul className="text-xs space-y-2 pt-3 border-t border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8]">
            <li className="flex justify-between">
              <span>Email Engagement (Click vs Open):</span>
              <span className="font-mono font-bold text-[#14B8A6] tabular-nums">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Website Session Frequency (3+ visits):</span>
              <span className="font-mono font-bold text-[#14B8A6] tabular-nums">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Event / Webinar Attendance:</span>
              <span className="font-mono font-bold text-[#14B8A6] tabular-nums">5 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Recency (Touchpoint in prior 14 days):</span>
              <span className="font-mono font-bold text-[#14B8A6] tabular-nums">5 pts</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Simulator */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-[#2563EB] dark:text-[#3B82F6]">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Interactive Lead Score Simulator &amp; Sandbox
              </h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                Simulate arbitrary prospect parameters to verify scoring engine logic &amp; rationale.
              </p>
            </div>
          </div>

          <Badge
            variant={
              simResult.category === 'HOT'
                ? 'hot'
                : simResult.category === 'WARM'
                ? 'warm'
                : 'cold'
            }
            size="md"
          >
            {simResult.category} : {simResult.totalScore} / 100 PTS
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-[#E2E8F0] dark:border-[#263449] text-xs">
          {/* Fit Controls */}
          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Company Size</label>
            <select
              value={simSize}
              onChange={e => setSimSize(e.target.value as any)}
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            >
              <option value="1000+">1000+ (10 pts)</option>
              <option value="501-1000">501-1000 (10 pts)</option>
              <option value="201-500">201-500 (7 pts)</option>
              <option value="11-50">11-50 (3 pts)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Industry</label>
            <select
              value={simIndustry}
              onChange={e => setSimIndustry(e.target.value as any)}
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            >
              <option value="Technology">Technology (10 pts)</option>
              <option value="Healthcare">Healthcare (10 pts)</option>
              <option value="Financial Services">Financial Services (10 pts)</option>
              <option value="Retail">Retail (3 pts)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Stakeholder Role</label>
            <select
              value={simRole}
              onChange={e => setSimRole(e.target.value as any)}
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            >
              <option value="C-Level">C-Level (5 pts)</option>
              <option value="VP">VP (5 pts)</option>
              <option value="Director">Director (3 pts)</option>
              <option value="Individual Contributor">Individual Contributor (1 pt)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Territory</label>
            <select
              value={simTerritory}
              onChange={e => setSimTerritory(e.target.value as any)}
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            >
              <option value="North America">North America (5 pts)</option>
              <option value="EMEA">EMEA (5 pts)</option>
              <option value="APAC">APAC (5 pts)</option>
              <option value="LATAM">LATAM (5 pts)</option>
            </select>
          </div>
        </div>

        {/* Intent & Engagement Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-[#E2E8F0] dark:border-[#263449] text-xs">
          <div className="space-y-2 bg-[#F8FAFC] dark:bg-[#0B1220] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] block">Intent Signals:</span>
            <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
              <input
                type="checkbox"
                checked={hasDemoRequest}
                onChange={e => setHasDemoRequest(e.target.checked)}
                className="rounded accent-[#2563EB]"
              />
              <span>Demo Request submitted (+15 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
              <input
                type="checkbox"
                checked={hasPricingView}
                onChange={e => setHasPricingView(e.target.checked)}
                className="rounded accent-[#2563EB]"
              />
              <span>Pricing Page viewed (+10 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
              <input
                type="checkbox"
                checked={hasProductInquiry}
                onChange={e => setHasProductInquiry(e.target.checked)}
                className="rounded accent-[#2563EB]"
              />
              <span>Product specification inquiry (+10 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
              <input
                type="checkbox"
                checked={hasPurchaseIntent}
                onChange={e => setHasPurchaseIntent(e.target.checked)}
                className="rounded accent-[#2563EB]"
              />
              <span>Quote request / Purchase form (+5 pts)</span>
            </label>
          </div>

          <div className="space-y-2 bg-[#F8FAFC] dark:bg-[#0B1220] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
            <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] block">Engagement Signals:</span>
            <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
              <input
                type="checkbox"
                checked={hasEmailClick}
                onChange={e => setHasEmailClick(e.target.checked)}
                className="rounded accent-[#2563EB]"
              />
              <span>Email click-through (+10 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
              <input
                type="checkbox"
                checked={websiteVisits >= 3}
                onChange={e => setWebsiteVisits(e.target.checked ? 3 : 1)}
                className="rounded accent-[#2563EB]"
              />
              <span>Website sessions &ge; 3 visits (+10 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
              <input
                type="checkbox"
                checked={hasEventAttendance}
                onChange={e => setHasEventAttendance(e.target.checked)}
                className="rounded accent-[#2563EB]"
              />
              <span>Webinar / Event attendance (+5 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-[#64748B] dark:text-[#94A3B8]">
              <input
                type="checkbox"
                checked={hasRecentInteraction}
                onChange={e => setHasRecentInteraction(e.target.checked)}
                className="rounded accent-[#2563EB]"
              />
              <span>Touchpoint in past 14 days (+5 pts)</span>
            </label>
          </div>
        </div>

        {/* Real-time Calculation Result Bar */}
        <div className="bg-[#101B33] text-white p-5 rounded-2xl border border-[#263449] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-5 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">FIT</span>
              <span className="text-base font-bold text-[#3B82F6] tabular-nums">{simResult.fitScore}/30</span>
            </div>
            <span className="text-slate-600 text-lg">+</span>
            <div>
              <span className="text-slate-400 block text-[10px]">INTENT</span>
              <span className="text-base font-bold text-[#60A5FA] tabular-nums">{simResult.intentScore}/40</span>
            </div>
            <span className="text-slate-600 text-lg">+</span>
            <div>
              <span className="text-slate-400 block text-[10px]">ENGAGEMENT</span>
              <span className="text-base font-bold text-[#14B8A6] tabular-nums">{simResult.engagementScore}/30</span>
            </div>
            <span className="text-slate-600 text-lg">=</span>
            <div>
              <span className="text-slate-400 block text-[10px]">TOTAL</span>
              <span className="text-xl font-bold text-white tabular-nums">{simResult.totalScore}/100</span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                simResult.category === 'HOT'
                  ? 'bg-[#EF4444] text-white'
                  : simResult.category === 'WARM'
                  ? 'bg-[#F59E0B] text-white'
                  : 'bg-[#3B82F6] text-white'
              }`}
            >
              {simResult.category} PROSPECT
            </span>
          </div>
        </div>
      </div>

      {/* Effective-dated Rules Table */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Effective-Dated Score Rules Configuration</h2>
          <Badge variant="teal">{scoreRules.length} Active Rules</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase border-b border-[#E2E8F0] dark:border-[#263449]">
                <th className="py-3 px-4">Rule ID</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Dimension</th>
                <th className="py-3 px-4">Criteria</th>
                <th className="py-3 px-4">Max Points</th>
                <th className="py-3 px-4">Effective Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70 text-[#0F172A] dark:text-[#F8FAFC]">
              {scoreRules.map(rule => (
                <tr key={rule.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold">{rule.id}</td>
                  <td className="py-3 px-4 font-semibold text-[#2563EB] dark:text-[#3B82F6]">{rule.category}</td>
                  <td className="py-3 px-4">{rule.dimension}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">{rule.criteria}</td>
                  <td className="py-3 px-4 font-mono font-bold tabular-nums">{rule.maxPoints} pts</td>
                  <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8] tabular-nums">
                    {new Date(rule.effectiveFrom).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
