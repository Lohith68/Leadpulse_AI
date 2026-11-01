import React, { useState, useMemo } from 'react';
import { Contact2, Search, Plus, Mail, Phone, Building } from 'lucide-react';
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
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Business Contacts
            </h1>
            <Badge variant="purple" size="md">
              {contacts.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Key stakeholders, executive decision makers, normalized emails, and company associations
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contact by name, email, job title..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>

        <select
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Contact ID</th>
                <th className="py-3 px-4">Full Name & Title</th>
                <th className="py-3 px-4">Associated Account</th>
                <th className="py-3 px-4">Email (Normalized)</th>
                <th className="py-3 px-4">Phone</th>
                <th className="py-3 px-4">Role Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map(contact => {
                const comp = companiesMap.get(contact.companyId);
                return (
                  <tr key={contact.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{contact.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">
                        {contact.firstName} {contact.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500">{contact.jobTitle}</div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-purple-700">
                      {comp?.name || contact.companyId}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {contact.email}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {contact.phone}
                    </td>
                    <td className="py-3 px-4">
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
              })}
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
            <label className="block font-semibold text-slate-700 mb-1">Company Account *</label>
            <select
              required
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
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
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Business Email *</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Job Title</label>
              <input
                type="text"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="Chief Technology Officer"
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Seniority Level</label>
              <select
                value={roleLevel}
                onChange={e => setRoleLevel(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              >
                <option value="C-Level">C-Level</option>
                <option value="VP">VP</option>
                <option value="Director">Director</option>
                <option value="Manager">Manager</option>
                <option value="Individual Contributor">Individual Contributor</option>
              </select>
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
              Save Contact
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
