import React, { useState, useMemo } from 'react';
import { Contact2, Search, Plus, Mail, Phone, Building, UserCheck, Award, Briefcase } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Contact, RoleLevel } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const ContactsView: React.FC = () => {
  const { contacts, companies, createContact } = useCRM();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [companyId, setCompanyId] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [roleLevel, setRoleLevel] = useState<RoleLevel>('Director');

  const companiesMap = useMemo(() => new Map(companies.map(c => [c.id, c])), [companies]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let cLevelOrVp = 0;
    let directors = 0;
    const associatedCompanyIds = new Set<string>();

    contacts.forEach(c => {
      if (c.roleLevel === 'C-Level' || c.roleLevel === 'VP') cLevelOrVp++;
      if (c.roleLevel === 'Director') directors++;
      if (c.companyId) associatedCompanyIds.add(c.companyId);
    });

    return {
      total: contacts.length,
      executiveCount: cLevelOrVp,
      directorsCount: directors,
      uniqueAccounts: associatedCompanyIds.size,
    };
  }, [contacts]);

  const filtered = useMemo(() => {
    return contacts.filter(c => {
      const matchSearch =
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase()) ||
        c.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
        c.id.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (roleFilter !== 'ALL' && c.roleLevel !== roleFilter) return false;
      return true;
    });
  }, [contacts, search, roleFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyId) return;

    const id = `CON-${String(contacts.length + 1).padStart(6, '0')}`;
    const comp = companiesMap.get(companyId);
    const now = new Date().toISOString();

    await createContact({
      id,
      companyId,
      firstName,
      lastName,
      email: email.toLowerCase(),
      normalizedEmail: email.toLowerCase().trim(),
      phone: phone || '+1-555-019-2834',
      jobTitle: jobTitle || 'Director of Operations',
      roleLevel,
      department: 'Corporate',
      city: comp?.city || 'San Francisco',
      country: comp?.country || 'USA',
      createdAt: now,
      updatedAt: now,
    });

    setIsModalOpen(false);
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setJobTitle('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Business Contacts
            </h1>
            <Badge variant="teal" size="md">
              {contacts.length} Decision Makers
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Key stakeholders, executive decision makers, normalized emails, and direct account affiliations.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Contacts</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{metrics.total}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Verified Stakeholders</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">C-Level & VP Tier</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">
            {metrics.executiveCount}
          </div>
          <div className="text-[11px] text-[#14B8A6] font-medium mt-1">Executive Decision Authority</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Director Level</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">
            {metrics.directorsCount}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Technical & Business Evaluators</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Accounts Covered</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">
            {metrics.uniqueAccounts}
          </div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Enterprise Coverage Base</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search contact by name, email, job title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2563EB] transition-colors"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] cursor-pointer"
        >
          <option value="ALL">All Role Levels</option>
          <option value="C-Level">C-Level</option>
          <option value="VP">VP</option>
          <option value="Director">Director</option>
          <option value="Manager">Manager</option>
          <option value="Individual Contributor">Individual Contributor</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] border-b border-[#E2E8F0] dark:border-[#263449] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="py-3 px-4">Contact ID</th>
                <th className="py-3 px-4">Full Name & Title</th>
                <th className="py-3 px-4">Associated Account</th>
                <th className="py-3 px-4">Email (Normalized)</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#64748B] dark:text-[#94A3B8] font-medium">
                    No business contacts match current criteria.
                  </td>
                </tr>
              ) : (
                filtered.map(contact => {
                  const comp = companiesMap.get(contact.companyId);
                  return (
                    <tr key={contact.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">{contact.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          {contact.firstName} {contact.lastName}
                        </div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">{contact.jobTitle}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#2563EB] dark:text-[#3B82F6]">
                        {comp?.name || contact.companyId}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8]" />
                          {contact.email}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8] font-mono text-[11px] tabular-nums">
                        {contact.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            contact.roleLevel === 'C-Level' || contact.roleLevel === 'VP'
                              ? 'purple'
                              : 'neutral'
                          }
                        >
                          {contact.roleLevel}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Contact Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Business Contact"
        subtitle="Associate a new stakeholder with an existing enterprise company (Format: CON-000001)"
      >
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Company Account *</label>
            <select
              required
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            >
              <option value="">Select target company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.id})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                placeholder="Jane"
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Business Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jane.doe@company.com"
              className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Chief Technology Officer"
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Seniority Level</label>
              <select
                value={roleLevel}
                onChange={e => setRoleLevel(e.target.value as any)}
                className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] rounded-xl p-2.5 text-xs focus:outline-none focus:border-[#2563EB]"
              >
                <option value="C-Level">C-Level</option>
                <option value="VP">VP</option>
                <option value="Director">Director</option>
                <option value="Manager">Manager</option>
                <option value="Individual Contributor">Individual Contributor</option>
              </select>
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
              Save Contact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
