import React, { useState, useMemo } from 'react';
import { History, Search, PlusCircle, AlertTriangle, Filter } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Activity, ActivityType } from '../../types/crm';
import { Badge } from '../common/Badge';

export const ActivitiesView: React.FC = () => {
  const { activities, leads } = useCRM();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Lead Activity Audit Stream
            </h1>
            <Badge variant="purple" size="md">
              {activities.length} Recorded
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Chronological touchpoint events driving intent & engagement scoring with temporal guard
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by activity ID, lead ID, or type..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Activity ID</th>
                <th className="py-3 px-4">Associated Lead</th>
                <th className="py-3 px-4">Touchpoint Event</th>
                <th className="py-3 px-4">Points Added</th>
                <th className="py-3 px-4">Event Timestamp</th>
                <th className="py-3 px-4">Temporal Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(act => (
                <tr key={act.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-700">{act.id}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-purple-700">{act.leadId}</td>
                  <td className="py-3 px-4 font-bold text-slate-900">{act.type}</td>
                  <td className="py-3 px-4 font-mono font-bold text-purple-700">
                    +{act.pointsContributed} pts
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {new Date(act.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
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
