import React, { useState } from 'react';
import { Target, Sparkles, CheckCircle2, RotateCw, Calculator, HelpCircle, Shield } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Lead Scoring Engine
            </h1>
            <Badge variant="purple" size="md">
              100-Point Max Rule Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Fit Score (30) + Intent Score (40) + Engagement Score (30) with strict temporal anti-leakage guards
          </p>
        </div>

        <button
          onClick={handleRecalculateAll}
          disabled={isRecalculatingAll || leads.length === 0}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isRecalculatingAll ? 'animate-spin' : ''}`} />
          {isRecalculatingAll ? 'Recalculating...' : 'Recalculate All Lead Scores'}
        </button>
      </div>

      {/* Rules Architecture Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Fit Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">1. Company Fit Score</h2>
            <Badge variant="info">Max 30 Pts</Badge>
          </div>
          <p className="text-xs text-slate-500">Evaluates account size, industry, job title, and geographic territory</p>
          <ul className="text-xs space-y-2 pt-2 border-t border-slate-100 text-slate-600">
            <li className="flex justify-between">
              <span>Company Size (500+ employees):</span>
              <span className="font-mono font-bold text-slate-900">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Industry Match (Tech, Health, Finance):</span>
              <span className="font-mono font-bold text-slate-900">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Job Role (C-Level / VP decision maker):</span>
              <span className="font-mono font-bold text-slate-900">5 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Geographic Fit (Target Territories):</span>
              <span className="font-mono font-bold text-slate-900">5 pts</span>
            </li>
          </ul>
        </div>

        {/* Intent Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">2. Purchase Intent Score</h2>
            <Badge variant="purple">Max 40 Pts</Badge>
          </div>
          <p className="text-xs text-slate-500">Active commercial signals indicating active solution evaluation</p>
          <ul className="text-xs space-y-2 pt-2 border-t border-slate-100 text-slate-600">
            <li className="flex justify-between">
              <span>Direct Demo Request Submission:</span>
              <span className="font-mono font-bold text-purple-700">15 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Pricing Page In-Depth Visit:</span>
              <span className="font-mono font-bold text-purple-700">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Technical Product Inquiry Form:</span>
              <span className="font-mono font-bold text-purple-700">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Purchase Intent / Quote Request:</span>
              <span className="font-mono font-bold text-purple-700">5 pts</span>
            </li>
          </ul>
        </div>

        {/* Engagement Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">3. Engagement Score</h2>
            <Badge variant="success">Max 30 Pts</Badge>
          </div>
          <p className="text-xs text-slate-500">Marketing interactions, email CTR, web sessions, and recency</p>
          <ul className="text-xs space-y-2 pt-2 border-t border-slate-100 text-slate-600">
            <li className="flex justify-between">
              <span>Email Engagement (Click vs Open):</span>
              <span className="font-mono font-bold text-emerald-700">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Website Session Frequency (3+ visits):</span>
              <span className="font-mono font-bold text-emerald-700">10 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Event / Webinar Attendance:</span>
              <span className="font-mono font-bold text-emerald-700">5 pts</span>
            </li>
            <li className="flex justify-between">
              <span>Recency (Touchpoint in prior 14 days):</span>
              <span className="font-mono font-bold text-emerald-700">5 pts</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Interactive Simulator */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-700">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Interactive Lead Score Simulator & Sandbox
              </h2>
              <p className="text-xs text-slate-400">
                Simulate arbitrary prospect parameters to verify scoring engine logic & rationale
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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
          {/* Fit Controls */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Company Size</label>
            <select
              value={simSize}
              onChange={e => setSimSize(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
            >
              <option value="1000+">1000+ (10 pts)</option>
              <option value="501-1000">501-1000 (10 pts)</option>
              <option value="201-500">201-500 (7 pts)</option>
              <option value="11-50">11-50 (3 pts)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Industry</label>
            <select
              value={simIndustry}
              onChange={e => setSimIndustry(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
            >
              <option value="Technology">Technology (10 pts)</option>
              <option value="Healthcare">Healthcare (10 pts)</option>
              <option value="Financial Services">Financial Services (10 pts)</option>
              <option value="Retail">Retail (3 pts)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Stakeholder Role</label>
            <select
              value={simRole}
              onChange={e => setSimRole(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
            >
              <option value="C-Level">C-Level (5 pts)</option>
              <option value="VP">VP (5 pts)</option>
              <option value="Director">Director (3 pts)</option>
              <option value="Individual Contributor">Individual Contributor (1 pt)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Territory</label>
            <select
              value={simTerritory}
              onChange={e => setSimTerritory(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
            >
              <option value="North America">North America (5 pts)</option>
              <option value="EMEA">EMEA (5 pts)</option>
              <option value="APAC">APAC (5 pts)</option>
              <option value="LATAM">LATAM (5 pts)</option>
            </select>
          </div>
        </div>

        {/* Intent & Engagement Checkboxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-100 text-xs">
          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block">Intent Signals:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasDemoRequest}
                onChange={e => setHasDemoRequest(e.target.checked)}
              />
              <span>Demo Request submitted (+15 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPricingView}
                onChange={e => setHasPricingView(e.target.checked)}
              />
              <span>Pricing Page viewed (+10 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasProductInquiry}
                onChange={e => setHasProductInquiry(e.target.checked)}
              />
              <span>Product specification inquiry (+10 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasPurchaseIntent}
                onChange={e => setHasPurchaseIntent(e.target.checked)}
              />
              <span>Quote request / Purchase form (+5 pts)</span>
            </label>
          </div>

          <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200">
            <span className="font-bold text-slate-800 block">Engagement Signals:</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEmailClick}
                onChange={e => setHasEmailClick(e.target.checked)}
              />
              <span>Email click-through (+10 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={websiteVisits >= 3}
                onChange={e => setWebsiteVisits(e.target.checked ? 3 : 1)}
              />
              <span>Website sessions &ge; 3 visits (+10 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasEventAttendance}
                onChange={e => setHasEventAttendance(e.target.checked)}
              />
              <span>Webinar / Event attendance (+5 pts)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasRecentInteraction}
                onChange={e => setHasRecentInteraction(e.target.checked)}
              />
              <span>Touchpoint in past 14 days (+5 pts)</span>
            </label>
          </div>
        </div>

        {/* Real-time Calculation Result Bar */}
        <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400 block text-[10px]">FIT</span>
              <span className="text-base font-bold text-blue-400">{simResult.fitScore}/30</span>
            </div>
            <span className="text-slate-600 text-lg">+</span>
            <div>
              <span className="text-slate-400 block text-[10px]">INTENT</span>
              <span className="text-base font-bold text-purple-400">{simResult.intentScore}/40</span>
            </div>
            <span className="text-slate-600 text-lg">+</span>
            <div>
              <span className="text-slate-400 block text-[10px]">ENGAGEMENT</span>
              <span className="text-base font-bold text-emerald-400">{simResult.engagementScore}/30</span>
            </div>
            <span className="text-slate-600 text-lg">=</span>
            <div>
              <span className="text-slate-400 block text-[10px]">TOTAL</span>
              <span className="text-xl font-black text-white">{simResult.totalScore}/100</span>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`px-3 py-1 rounded-md text-xs font-extrabold ${
                simResult.category === 'HOT'
                  ? 'bg-rose-500 text-white'
                  : simResult.category === 'WARM'
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-700 text-slate-200'
              }`}
            >
              {simResult.category} PROSPECT
            </span>
          </div>
        </div>
      </div>

      {/* Effective-dated Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Effective-Dated Score Rules Configuration</h2>
          <Badge variant="purple">{scoreRules.length} Active Rules</Badge>
        </div>
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
              <th className="py-2.5 px-4">Rule ID</th>
              <th className="py-2.5 px-4">Category</th>
              <th className="py-2.5 px-4">Dimension</th>
              <th className="py-2.5 px-4">Criteria</th>
              <th className="py-2.5 px-4">Max Points</th>
              <th className="py-2.5 px-4">Effective Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {scoreRules.map(rule => (
              <tr key={rule.id}>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{rule.id}</td>
                <td className="py-2.5 px-4 font-bold text-purple-700">{rule.category}</td>
                <td className="py-2.5 px-4 text-slate-800">{rule.dimension}</td>
                <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">{rule.criteria}</td>
                <td className="py-2.5 px-4 font-mono font-bold text-slate-900">{rule.maxPoints} pts</td>
                <td className="py-2.5 px-4 text-slate-500">
                  {new Date(rule.effectiveFrom).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
