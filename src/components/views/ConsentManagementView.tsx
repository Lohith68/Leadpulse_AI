import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Mail,
  Phone,
  MessageSquare,
  Lock,
  Download,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { ConsentStatus } from '../../types/crm';
import { exportEntityAsCSV } from '../../services/exportService';

export const ConsentManagementView: React.FC = () => {
  const { consents, leads, contacts, updateLeadConsent } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [channelFilter, setChannelFilter] = useState<string>('ALL');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [modalLeadId, setModalLeadId] = useState<string | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<'EMAIL' | 'PHONE' | 'SMS' | 'ALL'>('EMAIL');
  const [targetStatus, setTargetStatus] = useState<ConsentStatus>('OPTED_IN');

  // Stats computation
  const total = consents.length;
  const optedInCount = consents.filter(c => c.status === 'OPTED_IN').length;
  const optedOutCount = consents.filter(c => c.status === 'OPTED_OUT').length;
  const pendingCount = consents.filter(c => c.status === 'PENDING').length;
  const withdrawnCount = consents.filter(c => c.status === 'WITHDRAWN').length;
  const complianceRate = total > 0 ? Math.round(((optedInCount + optedOutCount + withdrawnCount) / total) * 100) : 100;

  // Filtered list
  const filteredConsents = consents.filter(c => {
    const matchesSearch =
      c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.leadId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.channel.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const matchesChannel = channelFilter === 'ALL' || c.channel === channelFilter;
    return matchesSearch && matchesStatus && matchesChannel;
  });

  const handleUpdateConsent = async () => {
    if (!modalLeadId) return;
    setIsUpdating(modalLeadId);
    try {
      await updateLeadConsent(modalLeadId, targetStatus, selectedChannel);
      setModalLeadId(null);
    } catch (err) {
      console.error('Failed to update consent:', err);
    } finally {
      setIsUpdating(null);
    }
  };

  const getStatusBadge = (status: ConsentStatus) => {
    switch (status) {
      case 'OPTED_IN':
        return (
          <Badge variant="success">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> OPTED IN
          </Badge>
        );
      case 'OPTED_OUT':
        return (
          <Badge variant="danger">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" /> OPTED OUT
          </Badge>
        );
      case 'WITHDRAWN':
        return (
          <Badge variant="warning">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" /> WITHDRAWN
          </Badge>
        );
      case 'PENDING':
      default:
        return (
          <Badge variant="neutral">
            <Clock className="w-3 h-3 text-slate-500" /> PENDING
          </Badge>
        );
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toUpperCase()) {
      case 'EMAIL':
        return <Mail className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'PHONE':
        return <Phone className="w-3.5 h-3.5 text-emerald-500" />;
      case 'SMS':
        return <MessageSquare className="w-3.5 h-3.5 text-purple-500" />;
      default:
        return <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">Consent &amp; Privacy Hub</h1>
            <Badge variant="teal">GDPR / TCPA Enforced</Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Audit-grade consent lifecycle management. Outreach to opted-out or withdrawn leads is blocked by system policy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportEntityAsCSV('consent', consents)}
            className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            Export consent.csv
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Consent Records</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{total.toLocaleString()}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Immutable Ledger Entries</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Opted In</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{optedInCount.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">{total > 0 ? Math.round((optedInCount / total) * 100) : 0}% of active pipeline</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Pending Verification</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">{pendingCount.toLocaleString()}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Outreach Throttled</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Opted Out</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{optedOutCount.toLocaleString()}</div>
          <div className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1">Zero Outreach Permitted</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Compliance Rate</div>
          <div className="text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6] mt-1 tabular-nums">{complianceRate}%</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">GDPR Article 7 Verified</div>
        </div>
      </div>

      {/* Enforcement Policy Callout */}
      <div className="bg-[#101B33] text-white rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-[#263449]">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-500/20 rounded-xl shrink-0 mt-0.5">
            <Lock className="w-5 h-5 text-[#3B82F6]" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-blue-200">
              Deterministic Communication Enforcement Engine
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl leading-relaxed">
              When a lead status is <span className="font-semibold text-rose-400">OPTED_OUT</span> or{' '}
              <span className="font-semibold text-amber-400">WITHDRAWN</span>, automated task creation and marketing blasts are strictly blocked. Any attempted contact creates a critical compliance anomaly (<code className="text-rose-300 text-[11px]">OPTED_OUT_LEAD_CONTACTED</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Consent ID, Lead ID, or Channel..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1220] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPTED_IN">Opted In</option>
              <option value="PENDING">Pending</option>
              <option value="OPTED_OUT">Opted Out</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] ml-2">
              <span>Channel:</span>
            </div>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              className="border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1220] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Channels</option>
              <option value="EMAIL">Email</option>
              <option value="PHONE">Phone</option>
              <option value="SMS">SMS</option>
              <option value="ALL">All Channels</option>
            </select>
          </div>
        </div>

        {/* Consent Records Table */}
        <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#263449] rounded-xl">
          <table className="w-full text-left text-xs text-[#0F172A] dark:text-[#F8FAFC]">
            <thead className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase border-b border-[#E2E8F0] dark:border-[#263449]">
              <tr>
                <th className="px-4 py-3">Consent Record ID</th>
                <th className="px-4 py-3">Lead Reference</th>
                <th className="px-4 py-3">Contact Name</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Consent Status</th>
                <th className="px-4 py-3">Recorded By / Source</th>
                <th className="px-4 py-3">Recorded At</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70">
              {filteredConsents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#64748B] dark:text-[#94A3B8]">
                    No consent records matching your search filter.
                  </td>
                </tr>
              ) : (
                filteredConsents.slice(0, 50).map(c => {
                  const lead = leads.find(l => l.id === c.leadId);
                  const contact = lead ? contacts.find(con => con.id === lead.contactId) : null;
                  const contactName = contact ? `${contact.firstName} ${contact.lastName}` : 'N/A';

                  return (
                    <tr key={c.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium">{c.id}</td>
                      <td className="px-4 py-3 font-mono text-[#2563EB] dark:text-[#3B82F6] font-semibold">{c.leadId}</td>
                      <td className="px-4 py-3 font-medium">{contactName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium">
                          {getChannelIcon(c.channel)}
                          <span>{c.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                      <td className="px-4 py-3 text-[#64748B] dark:text-[#94A3B8] text-[11px]">{c.recordedBy || c.source || 'Web Form'}</td>
                      <td className="px-4 py-3 text-[#64748B] dark:text-[#94A3B8] text-[11px] tabular-nums">
                        {new Date(c.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setModalLeadId(c.leadId);
                            setTargetStatus(c.status === 'OPTED_IN' ? 'OPTED_OUT' : 'OPTED_IN');
                          }}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-[#E2E8F0] dark:border-[#263449] text-[#2563EB] dark:text-[#3B82F6] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
                        >
                          Modify Status
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredConsents.length > 50 && (
          <div className="text-center text-xs text-[#64748B] dark:text-[#94A3B8] py-2">
            Showing first 50 of {filteredConsents.length.toLocaleString()} matching records.
          </div>
        )}
      </div>

      {/* Modify Consent Modal */}
      {modalLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] dark:border-[#263449] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#263449] pb-3">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                Update Communication Consent
              </h3>
              <button
                onClick={() => setModalLeadId(null)}
                className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] block mb-1">Target Lead ID</label>
                <input
                  type="text"
                  readOnly
                  value={modalLeadId}
                  className="w-full px-3 py-2 bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl font-mono text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] block mb-1">Channel</label>
                <select
                  value={selectedChannel}
                  onChange={e => setSelectedChannel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#263449] rounded-xl text-[#0F172A] dark:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1220]"
                >
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                  <option value="SMS">SMS</option>
                  <option value="ALL">All Channels</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] block mb-1">New Consent Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['OPTED_IN', 'OPTED_OUT', 'WITHDRAWN', 'PENDING'] as ConsentStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                        targetStatus === st
                          ? 'border-[#2563EB] bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#3B82F6]'
                          : 'border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
              <button
                onClick={() => setModalLeadId(null)}
                className="px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateConsent}
                disabled={isUpdating === modalLeadId}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold disabled:opacity-50 cursor-pointer transition-colors"
              >
                {isUpdating === modalLeadId ? 'Updating...' : 'Save Decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
