import React, { useState, useMemo } from 'react';
import { Building2, Search, Plus, Globe, Users, DollarSign, MapPin, Layers } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Company, Industry, Territory, CompanySize } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const CompaniesView: React.FC = () => {
  const { companies, leads, opportunities, createCompany } = useCRM();

  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [territoryFilter, setTerritoryFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [domain, setDomain] = useState('');
  const [industry, setIndustry] = useState<Industry>('Technology');
  const [size, setSize] = useState<CompanySize>('51-200');
  const [territory, setTerritory] = useState<Territory>('North America');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('USA');
  const [employeeCount, setEmployeeCount] = useState<number>(120);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalRev = 0;
    const indCounts: Record<string, number> = {};

    companies.forEach(c => {
      totalRev += c.annualRevenue || 0;
      indCounts[c.industry] = (indCounts[c.industry] || 0) + 1;
    });

    const topInd = Object.entries(indCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Technology';

    return {
      totalAccounts: companies.length,
      totalRevenue: totalRev,
      topIndustry: topInd,
      activeTerritories: new Set(companies.map(c => c.territory)).size,
    };
  }, [companies]);

  const filtered = useMemo(() => {
    return companies.filter(c => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase()) ||
        c.domain.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (industryFilter !== 'ALL' && c.industry !== industryFilter) return false;
      if (territoryFilter !== 'ALL' && c.territory !== territoryFilter) return false;
      return true;
    });
  }, [companies, search, industryFilter, territoryFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `CO-${String(companies.length + 1).padStart(6, '0')}`;
    const now = new Date().toISOString();
    await createCompany({
      id,
      name,
      domain: domain.toLowerCase(),
      industry,
      size,
      employeeCount,
      annualRevenue: employeeCount * 180000,
      city: city || 'San Francisco',
      state: state || 'CA',
      country,
      territory,
      createdAt: now,
      updatedAt: now,
    });
    setIsModalOpen(false);
    setName('');
    setDomain('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Companies & Accounts
            </h1>
            <Badge variant="purple" size="md">
              {companies.length} Accounts
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Enterprise accounts, industry classifications, revenue tiers, and linked prospect networks.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Accounts</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{metrics.totalAccounts}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Verified Organizations</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Est. Aggregate Revenue</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">
            ${(metrics.totalRevenue / 1000000000).toFixed(2)}B
          </div>
          <div className="text-[11px] text-[#14B8A6] font-medium mt-1">Market Capitalization Base</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Top Industry Sector</div>
          <div className="text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 truncate">
            {metrics.topIndustry}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Highest Account Density</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Global Territories</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">
            {metrics.activeTerritories} Regions
          </div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">NA · EMEA · APAC · LATAM</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search company name, domain, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2563EB] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <select
            value={industryFilter}
            onChange={e => setIndustryFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="ALL">All Industries</option>
            <option value="Technology">Technology</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Financial Services">Financial Services</option>
            <option value="Manufacturing">Manufacturing</option>
            <option value="Retail">Retail</option>
            <option value="Education">Education</option>
            <option value="Telecommunications">Telecommunications</option>
            <option value="Energy">Energy</option>
          </select>

          <select
            value={territoryFilter}
            onChange={e => setTerritoryFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="ALL">All Territories</option>
            <option value="North America">North America</option>
            <option value="EMEA">EMEA</option>
            <option value="APAC">APAC</option>
            <option value="LATAM">LATAM</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] border-b border-[#E2E8F0] dark:border-[#263449] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Size & Employees</th>
                <th className="py-3 px-4">Territory & Location</th>
                <th className="py-3 px-4">Linked Leads</th>
                <th className="py-3 px-4 text-right">Est. Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B] dark:text-[#94A3B8] font-medium">
                    No enterprise accounts found matching current query.
                  </td>
                </tr>
              ) : (
                filtered.map(comp => {
                  const compLeads = leads.filter(l => l.companyId === comp.id);
                  return (
                    <tr key={comp.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">{comp.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{comp.name}</div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1 mt-0.5">
                          <Globe className="w-3 h-3 text-[#2563EB]" /> {comp.domain}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-medium text-[#0F172A] dark:text-[#F8FAFC]">{comp.industry}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{comp.size}</span>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] tabular-nums">
                          {comp.employeeCount.toLocaleString()} employees
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{comp.territory}</span>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          {comp.city}, {comp.country}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="purple">{compLeads.length} Leads</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                        ${(comp.annualRevenue / 1000000).toFixed(1)}M
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Company Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Enterprise Account"
        subtitle="Register new parent organization (Format: CO-000001)"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Acme Corporation"
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Website Domain *</label>
            <input
              type="text"
              required
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="acme-corp.com"
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value as any)}
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Technology">Technology</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Financial Services">Financial Services</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Retail">Retail</option>
                <option value="Education">Education</option>
                <option value="Telecommunications">Telecommunications</option>
                <option value="Energy">Energy</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Company Size</label>
              <select
                value={size}
                onChange={e => setSize(e.target.value as any)}
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              >
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Territory</label>
              <select
                value={territory}
                onChange={e => setTerritory(e.target.value as any)}
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              >
                <option value="North America">North America</option>
                <option value="EMEA">EMEA</option>
                <option value="APAC">APAC</option>
                <option value="LATAM">LATAM</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Employee Count</label>
              <input
                type="number"
                value={employeeCount}
                onChange={e => setEmployeeCount(Number(e.target.value))}
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
              Save Company
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
