import React, { useState, useMemo } from 'react';
import { History, Search, PlusCircle, AlertTriangle, Filter, Activity as ActivityIcon } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Activity, ActivityType } from '../../types/crm';
import { Badge } from '../common/Badge';

export const ActivitiesView: React.FC = () => {
  const { activities, leads } = useCRM();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const metrics = useMemo(() => {
    let demoOrPricing = 0;
    let postConversion = 0;

    activities.forEach(a => {
      if (a.type === 'DEMO_REQUEST' || a.type === 'PRICING_PAGE_VIEW') demoOrPricing++;
      if (a.isPostConversion) postConversion++;
    });

    return {
      total: activities.length,
      demoOrPricing,
      postConversion,
      validHistorical: activities.length - postConversion,
    };
  }, [activities]);

  const filtered = useMemo(() => {
    return activities.filter(a => {
      const matchSearch =
        a.id.toLowerCase().includes(search.toLowerCase()) ||
        a.leadId.toLowerCase().includes(search.toLowerCase()) ||
        a.type.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (typeFilter !== 'ALL' && a.type !== typeFilter) return false;
      return true;
    });
  }, [activities, search, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Lead Activity Audit Stream
            </h1>
            <Badge variant="teal" size="md">
              {activities.length} Recorded
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Chronological touchpoint events driving intent &amp; engagement scoring with temporal guard against leakage.
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Recorded Events</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{metrics.total.toLocaleString()}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Multi-Channel Interactions</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">High Intent Touchpoints</div>
          <div className="text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6] mt-1 tabular-nums">{metrics.demoOrPricing.toLocaleString()}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Demo &amp; Pricing Page Views</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Historical Scoring Base</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{metrics.validHistorical.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Pre-Conversion Events</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Leakage Guards Active</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">{metrics.postConversion} Excluded</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium mt-1">Post-Conversion Filtered</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by activity ID, lead ID, or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2563EB] transition-colors"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] cursor-pointer"
        >
          <option value="ALL">All Activity Types</option>
          <option value="DEMO_REQUEST">Demo Request (+15)</option>
          <option value="PRICING_PAGE_VIEW">Pricing Page View (+10)</option>
          <option value="PRODUCT_INQUIRY">Product Inquiry (+10)</option>
          <option value="PURCHASE_INTENT_FORM">Purchase Intent Form (+5)</option>
          <option value="EMAIL_CLICK">Email Click (+10)</option>
          <option value="EMAIL_OPEN">Email Open (+5)</option>
          <option value="WEBSITE_VISIT">Website Visit (+5)</option>
          <option value="EVENT_ATTENDANCE">Event Attendance (+5)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] border-b border-[#E2E8F0] dark:border-[#263449] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="py-3 px-4">Activity ID</th>
                <th className="py-3 px-4">Associated Lead</th>
                <th className="py-3 px-4">Touchpoint Event</th>
                <th className="py-3 px-4">Points Added</th>
                <th className="py-3 px-4">Event Timestamp</th>
                <th className="py-3 px-4">Temporal Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70 text-xs">
              {filtered.slice(0, 100).map(act => (
                <tr key={act.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">{act.id}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#2563EB] dark:text-[#3B82F6]">{act.leadId}</td>
                  <td className="py-3.5 px-4 font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{act.type}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] tabular-nums">
                    +{act.pointsContributed} pts
                  </td>
                  <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8] tabular-nums">
                    {new Date(act.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    {act.isPostConversion ? (
                      <Badge variant="danger">POST-CONVERSION (EXCLUDED)</Badge>
                    ) : (
                      <Badge variant="success">Historical Valid</Badge>
                    )}
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
