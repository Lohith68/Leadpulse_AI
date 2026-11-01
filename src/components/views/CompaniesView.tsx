import React, { useState, useMemo } from 'react';
import { Building2, Search, Plus, Filter, Globe, Users, DollarSign, MapPin } from 'lucide-react';
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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Companies & Accounts
            </h1>
            <Badge variant="purple" size="md">
              {companies.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Enterprise accounts, industry classifications, revenue tiers, and linked prospects
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Company
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search company name, domain, ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>

        <select
          value={industryFilter}
          onChange={e => setIndustryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
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
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Territories</option>
          <option value="North America">North America</option>
          <option value="EMEA">EMEA</option>
          <option value="APAC">APAC</option>
          <option value="LATAM">LATAM</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Account ID</th>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Industry</th>
                <th className="py-3 px-4">Size & Employees</th>
                <th className="py-3 px-4">Territory & Location</th>
                <th className="py-3 px-4">Linked Leads</th>
                <th className="py-3 px-4 text-right">Est. Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(comp => {
                const compLeads = leads.filter(l => l.companyId === comp.id);
                return (
                  <tr key={comp.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{comp.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{comp.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {comp.domain}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-700">{comp.industry}</td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{comp.size}</span>
                      <div className="text-[11px] text-slate-400">
                        {comp.employeeCount.toLocaleString()} employees
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-slate-800">{comp.territory}</span>
                      <div className="text-[11px] text-slate-400">
                        {comp.city}, {comp.country}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="purple">{compLeads.length} Leads</Badge>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${(comp.annualRevenue / 1000000).toFixed(1)}M
                    </td>
                  </tr>
                );
              })}
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
            <label className="block font-semibold text-slate-700 mb-1">Company Name *</label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Website Domain *</label>
            <input
              type="text"
              required
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="acme-corp.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Industry</label>
              <select
                value={industry}
                onChange={e => setIndustry(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
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
              <label className="block font-semibold text-slate-700 mb-1">Company Size</label>
              <select
                value={size}
                onChange={e => setSize(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
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
              <label className="block font-semibold text-slate-700 mb-1">Territory</label>
              <select
                value={territory}
                onChange={e => setTerritory(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              >
                <option value="North America">North America</option>
                <option value="EMEA">EMEA</option>
                <option value="APAC">APAC</option>
                <option value="LATAM">LATAM</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee Count</label>
              <input
                type="number"
                value={employeeCount}
                onChange={e => setEmployeeCount(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold"
            >
              Save Company
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
