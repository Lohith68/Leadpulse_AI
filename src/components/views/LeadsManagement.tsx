import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  ArrowUpDown,
  Eye,
  Trash2,
  Briefcase,
  Target,
  Sparkles,
  Shield,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { useAuth } from '../../context/AuthContext';
import { Lead, ScoreCategory, ConsentStatus, Territory, ProductInterest } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { LeadDetailsDrawer } from './LeadDetailsDrawer';

export const LeadsManagement: React.FC = () => {
  const {
    leads,
    companies,
    contacts,
    campaigns,
    salesReps,
    createLead,
    deleteLead,
    recalculateLeadScoreAction,
    createOpportunityFromLead,
    createActivity,
  } = useCRM();
  const { can, activeRole } = useAuth();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [scoreCategoryFilter, setScoreCategoryFilter] = useState<string>('ALL');
  const [territoryFilter, setTerritoryFilter] = useState<string>('ALL');
  const [consentFilter, setConsentFilter] = useState<string>('ALL');
  const [lifecycleFilter, setLifecycleFilter] = useState<string>('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Drawer & Modals state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [targetLeadForAction, setTargetLeadForAction] = useState<Lead | null>(null);

  // New Lead Form state
  const [newLeadCompanyId, setNewLeadCompanyId] = useState('');
  const [newLeadContactId, setNewLeadContactId] = useState('');
  const [newLeadProduct, setNewLeadProduct] = useState<ProductInterest>('Enterprise Cloud');
  const [newLeadConsent, setNewLeadConsent] = useState<ConsentStatus>('OPTED_IN');
  const [formError, setFormError] = useState('');

  // Convert Opportunity Form state
  const [dealName, setDealName] = useState('');
  const [dealValue, setDealValue] = useState<number>(75000);
  const [convertError, setConvertError] = useState('');

  // Log Activity Form state
  const [activityType, setActivityType] = useState<any>('DEMO_REQUEST');
  const [activityPoints, setActivityPoints] = useState<number>(15);

  // Lookups maps
  const companiesMap = useMemo(() => new Map(companies.map(c => [c.id, c])), [companies]);
  const contactsMap = useMemo(() => new Map(contacts.map(c => [c.id, c])), [contacts]);
  const repsMap = useMemo(() => new Map(salesReps.map(r => [r.id, r])), [salesReps]);

  // Filtered Leads
  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const company = companiesMap.get(lead.companyId);
      const contact = contactsMap.get(lead.contactId);

      // Search match
      const query = searchTerm.toLowerCase();
      const matchesSearch =
        lead.id.toLowerCase().includes(query) ||
        (company && company.name.toLowerCase().includes(query)) ||
        (contact && `${contact.firstName} ${contact.lastName}`.toLowerCase().includes(query)) ||
        (contact && contact.email.toLowerCase().includes(query));

      if (!matchesSearch) return false;

      // Filter matches
      if (scoreCategoryFilter !== 'ALL' && lead.scoreCategory !== scoreCategoryFilter) return false;
      if (territoryFilter !== 'ALL' && lead.territory !== territoryFilter) return false;
      if (consentFilter !== 'ALL' && lead.consentStatus !== consentFilter) return false;
      if (lifecycleFilter !== 'ALL' && lead.lifecycleStatus !== lifecycleFilter) return false;

      return true;
    });
  }, [leads, searchTerm, scoreCategoryFilter, territoryFilter, consentFilter, lifecycleFilter, companiesMap, contactsMap]);

  // Sorting state
  const [sortField, setSortField] = useState<'id' | 'score' | 'createdAt'>('score');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Paginated Leads with Sorting
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let comparison = 0;
      if (sortField === 'score') {
        comparison = (a.totalScore || 0) - (b.totalScore || 0);
      } else if (sortField === 'id') {
        comparison = a.id.localeCompare(b.id);
      } else if (sortField === 'createdAt') {
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [filteredLeads, sortField, sortAsc]);

  const totalPages = Math.ceil(sortedLeads.length / pageSize) || 1;
  const paginatedLeads = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedLeads.slice(start, start + pageSize);
  }, [sortedLeads, currentPage, pageSize]);

  // Handle Create Lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newLeadCompanyId || !newLeadContactId) {
      setFormError('Please select both a Company and a Contact.');
      return;
    }

    try {
      await createLead({
        companyId: newLeadCompanyId,
        contactId: newLeadContactId,
        productInterest: newLeadProduct,
        consentStatus: newLeadConsent,
      });
      setIsCreateModalOpen(false);
      setNewLeadCompanyId('');
      setNewLeadContactId('');
    } catch (err: any) {
      setFormError(err.message || 'Failed to create lead.');
    }
  };

  // Handle Convert to Opportunity
  const handleConvertOpportunity = async (e: React.FormEvent) => {
    e.preventDefault();
    setConvertError('');
    if (!targetLeadForAction) return;

    try {
      await createOpportunityFromLead(targetLeadForAction.id, dealName, dealValue);
      setIsConvertModalOpen(false);
      setTargetLeadForAction(null);
    } catch (err: any) {
      setConvertError(err.message || 'Failed to convert opportunity.');
    }
  };

  // Handle Log Activity
  const handleLogActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetLeadForAction) return;

    try {
      await createActivity({
        leadId: targetLeadForAction.id,
        type: activityType,
        pointsContributed: activityPoints,
        timestamp: new Date().toISOString(),
        isPostConversion: targetLeadForAction.lifecycleStatus === 'CONVERTED',
      });
      setIsActivityModalOpen(false);
      setTargetLeadForAction(null);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-5">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Leads Management
            </h1>
            <Badge variant="purple" size="md">
              {filteredLeads.length} Total
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Transparent 100-point scoring, SLA tracking, territory verification, and consent management
          </p>
        </div>

        {can('create', 'leads') && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create New Lead
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, company, contact name, or email..."
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-600/20 focus:border-purple-600 text-slate-900"
            />
          </div>

          {/* Score Category Filter */}
          <select
            value={scoreCategoryFilter}
            onChange={e => {
              setScoreCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Categories</option>
            <option value="HOT">HOT (80-100 pts)</option>
            <option value="WARM">WARM (50-79 pts)</option>
            <option value="COLD">COLD (0-49 pts)</option>
          </select>

          {/* Territory Filter */}
          <select
            value={territoryFilter}
            onChange={e => {
              setTerritoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Territories</option>
            <option value="North America">North America</option>
            <option value="EMEA">EMEA</option>
            <option value="APAC">APAC</option>
            <option value="LATAM">LATAM</option>
          </select>

          {/* Consent Status Filter */}
          <select
            value={consentFilter}
            onChange={e => {
              setConsentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Consent States</option>
            <option value="OPTED_IN">OPTED_IN</option>
            <option value="OPTED_OUT">OPTED_OUT</option>
            <option value="PENDING">PENDING</option>
            <option value="WITHDRAWN">WITHDRAWN</option>
          </select>
        </div>
      </div>

      {/* Main Leads Table */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-[#E2E8F0] dark:border-[#263449] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                <th
                  onClick={() => {
                    if (sortField === 'id') setSortAsc(!sortAsc);
                    else { setSortField('id'); setSortAsc(true); }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                >
                  <div className="flex items-center gap-1">
                    <span>Lead ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Contact &amp; Account</th>
                <th className="py-3 px-4">Territory &amp; Source</th>
                <th
                  onClick={() => {
                    if (sortField === 'score') setSortAsc(!sortAsc);
                    else { setSortField('score'); setSortAsc(false); }
                  }}
                  className="py-3 px-4 text-center cursor-pointer hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Score (0-100)</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Consent</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Assigned Rep</th>
                <th
                  onClick={() => {
                    if (sortField === 'createdAt') setSortAsc(!sortAsc);
                    else { setSortField('createdAt'); setSortAsc(false); }
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
                >
                  <div className="flex items-center gap-1">
                    <span>Created Date</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {paginatedLeads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-medium">
                    No leads found matching current filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedLeads.map(lead => {
                  const company = companiesMap.get(lead.companyId);
                  const contact = contactsMap.get(lead.contactId);
                  const rep = salesReps.find(r => r.id === lead.assignedRepId);

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelectedLead(lead)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Lead ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                        {lead.id}
                        {lead.isDuplicate && (
                          <span className="block text-[10px] text-amber-600 font-semibold font-sans">
                            Duplicate Group
                          </span>
                        )}
                      </td>

                      {/* Account & Contact */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 group-hover:text-purple-700 transition-colors">
                          {company?.name || lead.companyId}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {contact ? `${contact.firstName} ${contact.lastName} (${contact.jobTitle})` : lead.contactId}
                        </div>
                      </td>

                      {/* Territory & Interest */}
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{lead.territory}</span>
                        <div className="text-[11px] text-slate-500">{lead.productInterest}</div>
                      </td>

                      {/* Score Breakdown (Fit 30, Intent 40, Eng 30) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                          <span className="text-blue-700 font-bold" title="Fit Score (max 30)">
                            F:{lead.fitScore}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="text-purple-700 font-bold" title="Intent Score (max 40)">
                            I:{lead.intentScore}
                          </span>
                          <span className="text-slate-300">/</span>
                          <span className="text-emerald-700 font-bold" title="Engagement Score (max 30)">
                            E:{lead.engagementScore}
                          </span>
                        </div>
                      </td>

                      {/* Score Category Badge */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            lead.scoreCategory === 'HOT'
                              ? 'hot'
                              : lead.scoreCategory === 'WARM'
                              ? 'warm'
                              : 'cold'
                          }
                          size="md"
                        >
                          {lead.scoreCategory} ({lead.totalScore})
                        </Badge>
                      </td>

                      {/* Consent Status */}
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            lead.consentStatus === 'OPTED_IN'
                              ? 'success'
                              : lead.consentStatus === 'OPTED_OUT' || lead.consentStatus === 'WITHDRAWN'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {lead.consentStatus}
                        </Badge>
                      </td>

                      {/* Lifecycle Status */}
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {lead.lifecycleStatus}
                      </td>

                      {/* Assigned Rep */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {rep ? rep.name.split(' ')[0] : <span className="text-slate-400 italic">Unassigned</span>}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-[11px] text-[#64748B] dark:text-[#94A3B8] whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString()}
                      </td>

                      {/* Actions */}
                      <td
                        className="py-3.5 px-4 text-right"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedLead(lead)}
                            className="p-1.5 text-slate-400 hover:text-purple-600 rounded-md hover:bg-purple-50 transition-colors cursor-pointer"
                            title="Inspect Score & Activity"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {can('create', 'opportunities') && (
                            <button
                              onClick={() => {
                                setTargetLeadForAction(lead);
                                setDealName(`${company?.name || 'Account'} - ${lead.productInterest}`);
                                setIsConvertModalOpen(true);
                              }}
                              disabled={lead.lifecycleStatus === 'CONVERTED'}
                              className="p-1.5 text-slate-400 hover:text-emerald-600 rounded-md hover:bg-emerald-50 transition-colors disabled:opacity-30 cursor-pointer"
                              title="Convert to Opportunity"
                            >
                              <Briefcase className="w-4 h-4" />
                            </button>
                          )}
                          {can('delete', 'leads') && (
                            <button
                              onClick={() => deleteLead(lead.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete Lead"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-slate-200 rounded px-2 py-1 text-xs cursor-pointer focus:outline-none"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-slate-400">|</span>
            <span>
              Showing {filteredLeads.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, filteredLeads.length)} of {filteredLeads.length} leads
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Lead Details Drawer */}
      <LeadDetailsDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onOpenConvertModal={lead => {
          setSelectedLead(null);
          setTargetLeadForAction(lead);
          setDealName(`${companiesMap.get(lead.companyId)?.name || 'Account'} - ${lead.productInterest}`);
          setIsConvertModalOpen(true);
        }}
        onOpenActivityModal={lead => {
          setSelectedLead(null);
          setTargetLeadForAction(lead);
          setIsActivityModalOpen(true);
        }}
      />

      {/* Modal: Create New Lead */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Lead"
        subtitle="Ingest a new prospect with automated score calculation and territory routing"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateLead} className="space-y-4 text-xs">
          {formError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Company Account *</label>
            <select
              value={newLeadCompanyId}
              onChange={e => setNewLeadCompanyId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
            >
              <option value="">Select target company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.industry} • {c.territory} • {c.size})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Contact Person *</label>
            <select
              value={newLeadContactId}
              onChange={e => setNewLeadContactId(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
            >
              <option value="">Select contact...</option>
              {contacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} ({c.jobTitle} • {c.email})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Product Interest</label>
              <select
                value={newLeadProduct}
                onChange={e => setNewLeadProduct(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
              >
                <option value="Enterprise Cloud">Enterprise Cloud</option>
                <option value="Security & Compliance">Security & Compliance</option>
                <option value="Data & AI">Data & AI</option>
                <option value="Core CRM">Core CRM</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Consent Status</label>
              <select
                value={newLeadConsent}
                onChange={e => setNewLeadConsent(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
              >
                <option value="OPTED_IN">OPTED_IN (Permitted)</option>
                <option value="PENDING">PENDING (Double Opt-in)</option>
                <option value="OPTED_OUT">OPTED_OUT (Blocked)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold shadow-xs"
            >
              Create & Score Lead
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Convert to Opportunity */}
      <Modal
        isOpen={isConvertModalOpen}
        onClose={() => setIsConvertModalOpen(false)}
        title="Convert Lead to Opportunity"
        subtitle={`Generate active sales pipeline opportunity for ${targetLeadForAction?.id}`}
        maxWidth="md"
      >
        <form onSubmit={handleConvertOpportunity} className="space-y-4 text-xs">
          {convertError && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {convertError}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Opportunity Name *</label>
            <input
              type="text"
              value={dealName}
              onChange={e => setDealName(e.target.value)}
              required
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Deal Value ($ USD) *</label>
            <input
              type="number"
              value={dealValue}
              onChange={e => setDealValue(Number(e.target.value))}
              required
              min={1000}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
            />
          </div>

          <div className="p-2.5 rounded-lg bg-purple-50 text-purple-900 text-[11px] leading-relaxed">
            Converting creates a new Opportunity record in stage <strong>NEW</strong> and automatically records an immutable initial StageHistory audit event. Single active opportunity invariant is strictly enforced.
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsConvertModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
            >
              Convert Now
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Log Activity */}
      <Modal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        title="Log Activity Touchpoint"
        subtitle={`Record engagement for ${targetLeadForAction?.id} with real-time score adjustment`}
        maxWidth="md"
      >
        <form onSubmit={handleLogActivity} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Activity Type *</label>
            <select
              value={activityType}
              onChange={e => {
                const val = e.target.value;
                setActivityType(val);
                if (val === 'DEMO_REQUEST') setActivityPoints(15);
                else if (val === 'PRICING_PAGE_VIEW' || val === 'PRODUCT_INQUIRY' || val === 'EMAIL_CLICK') setActivityPoints(10);
                else setActivityPoints(5);
              }}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:outline-none"
            >
              <option value="DEMO_REQUEST">Demo Request (+15 Intent Points)</option>
              <option value="PRICING_PAGE_VIEW">Pricing Page View (+10 Intent Points)</option>
              <option value="PRODUCT_INQUIRY">Product Inquiry (+10 Intent Points)</option>
              <option value="PURCHASE_INTENT_FORM">Purchase Intent Form (+5 Intent Points)</option>
              <option value="EMAIL_CLICK">Email Click (+10 Engagement Points)</option>
              <option value="EMAIL_OPEN">Email Open (+5 Engagement Points)</option>
              <option value="WEBSITE_VISIT">Website Visit (+5 Engagement Points)</option>
              <option value="EVENT_ATTENDANCE">Event Attendance (+5 Engagement Points)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Points Contributed</label>
            <input
              type="number"
              value={activityPoints}
              readOnly
              className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2 text-xs font-bold text-purple-700"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsActivityModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold shadow-xs"
            >
              Log Touchpoint
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
