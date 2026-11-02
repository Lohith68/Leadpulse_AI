import React, { useState, useMemo } from 'react';
import { Megaphone, Plus, DollarSign, Users, Award, TrendingUp, Search } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Campaign } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const CampaignsView: React.FC = () => {
  const { campaigns } = useCRM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('Webinar');
  const [budget, setBudget] = useState(50000);

  // Aggregate KPI metrics
  const metrics = useMemo(() => {
    let totalBudget = 0;
    let totalLeads = 0;
    let totalConversions = 0;
    let active = 0;

    campaigns.forEach(c => {
      totalBudget += c.budget || 0;
      totalLeads += c.leadsCount || 0;
      totalConversions += c.conversionsCount || 0;
      if (c.status === 'ACTIVE') active++;
    });

    const avgConversionRate = totalLeads > 0 ? ((totalConversions / totalLeads) * 100).toFixed(1) : '0.0';

    return {
      total: campaigns.length,
      active,
      totalBudget,
      totalLeads,
      totalConversions,
      avgConversionRate,
    };
  }, [campaigns]);

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.id.toLowerCase().includes(q) && !c.type.toLowerCase().includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [campaigns, statusFilter, search]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `CMP-${String(campaigns.length + 1).padStart(6, '0')}`;
    const now = new Date().toISOString();
    const newCamp: Campaign = {
      id,
      name,
      type,
      budget,
      status: 'ACTIVE',
      startDate: now,
      leadsCount: 0,
      conversionsCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(doc(db, 'campaigns', id), newCamp);
    setIsModalOpen(false);
    setName('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Marketing Campaigns
            </h1>
            <Badge variant="teal" size="md">
              {campaigns.length} Initiatives
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Demand generation programs, omnichannel marketing attribution, budgets, and lead acquisition efficiency.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          New Campaign
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Programs</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{metrics.total}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">{metrics.active} Active Initiatives</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Allocated Budget</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">
            ${(metrics.totalBudget / 1000).toFixed(0)}k
          </div>
          <div className="text-[11px] text-[#14B8A6] font-medium mt-1">Total Deployed Capital</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Leads Generated</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{metrics.totalLeads}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">{metrics.totalConversions} Converted Won</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Avg Conversion Rate</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {metrics.avgConversionRate}%
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Lead to Deal Won</div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search campaign name or type..."
            className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2563EB] transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] cursor-pointer"
        >
          <option value="ALL">All Campaign Statuses</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="DRAFT">DRAFT</option>
        </select>
      </div>

      {/* Campaign Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCampaigns.length === 0 ? (
          <div className="col-span-full bg-white dark:bg-[#111C2E] p-12 text-center rounded-2xl border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8]">
            No campaigns found matching current filters.
          </div>
        ) : (
          filteredCampaigns.map(camp => {
            const costPerLead =
              camp.leadsCount > 0 ? Math.round(camp.budget / camp.leadsCount) : 0;
            const convRate =
              camp.leadsCount > 0 ? ((camp.conversionsCount / camp.leadsCount) * 100).toFixed(1) : '0.0';

            return (
              <div
                key={camp.id}
                className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-5 shadow-xs space-y-4 flex flex-col justify-between hover:border-[#2563EB]/40 dark:hover:border-[#3B82F6]/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8]">{camp.id}</span>
                    <Badge variant={camp.status === 'ACTIVE' ? 'success' : 'neutral'}>
                      {camp.status}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug">{camp.name}</h3>
                  <span className="text-xs font-semibold text-[#2563EB] dark:text-[#3B82F6] mt-0.5 block">{camp.type}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#E2E8F0] dark:border-[#263449] text-xs">
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block font-medium">Budget:</span>
                    <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      ${(camp.budget / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block font-medium">Cost / Lead:</span>
                    <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      ${costPerLead}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block font-medium">Leads Ingested:</span>
                    <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">{camp.leadsCount}</span>
                  </div>
                  <div>
                    <span className="text-[#64748B] dark:text-[#94A3B8] block font-medium">Conversions:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {camp.conversionsCount} ({convRate}%)
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create Marketing Campaign"
        subtitle="Track inbound leads generated by this marketing initiative"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Campaign Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Q4 Enterprise Infrastructure Summit"
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Campaign Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Webinar">Webinar</option>
                <option value="Outbound Email">Outbound Email</option>
                <option value="Paid Search">Paid Search</option>
                <option value="Trade Show">Trade Show</option>
                <option value="Content Syndication">Content Syndication</option>
                <option value="Partner Referral">Partner Referral</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Allocated Budget ($)</label>
              <input
                type="number"
                value={budget}
                onChange={e => setBudget(Number(e.target.value))}
                min={1000}
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#263449] flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3.5 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8] font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold transition-colors"
            >
              Save Campaign
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
