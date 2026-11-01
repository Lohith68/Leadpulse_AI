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
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> OPTED IN
          </Badge>
        );
      case 'OPTED_OUT':
        return (
          <Badge variant="danger">
            <XCircle className="w-3 h-3 text-rose-600" /> OPTED OUT
          </Badge>
        );
      case 'WITHDRAWN':
        return (
          <Badge variant="warning">
            <AlertTriangle className="w-3 h-3 text-amber-600" /> WITHDRAWN
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
        return <Mail className="w-3.5 h-3.5 text-blue-500" />;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Consent &amp; Privacy Hub</h1>
            <Badge variant="purple">GDPR / TCPA Enforced</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Audit-grade consent lifecycle management. Outreach to opted-out or withdrawn leads is blocked by system policy.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportEntityAsCSV('consent', consents)}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export consent.csv
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Consent Events</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{total.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Immutable ledger entries</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Opted In</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{optedInCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">{total > 0 ? Math.round((optedInCount / total) * 100) : 0}% of active pipeline</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Pending Review</div>
          <div className="text-2xl font-black text-amber-700 mt-1">{pendingCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Outreach throttled</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Opted Out</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{optedOutCount.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Zero outreach permitted</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Compliance Rate</div>
          <div className="text-2xl font-black text-purple-700 mt-1">{complianceRate}%</div>
          <div className="text-[10px] text-slate-400 mt-1">GDPR Article 7 verified</div>
        </div>
      </div>

      {/* Enforcement Policy Callout */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg shrink-0 mt-0.5">
            <Lock className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-purple-200">
              Deterministic Communication Enforcement Engine
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 max-w-3xl">
              When a lead status is <span className="font-semibold text-rose-300">OPTED_OUT</span> or{' '}
              <span className="font-semibold text-amber-300">WITHDRAWN</span>, automated task creation and marketing blasts are strictly blocked. Any attempted contact creates a critical compliance anomaly (<code className="text-rose-400 text-[11px]">OPTED_OUT_LEAD_CONTACTED</code>).
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Consent ID, Lead ID, or Channel..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPTED_IN">Opted In</option>
              <option value="PENDING">Pending</option>
              <option value="OPTED_OUT">Opted Out</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              <span>Channel:</span>
            </div>
            <select
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white"
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
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Consent Record ID</th>
                <th className="px-4 py-2.5">Lead Reference</th>
                <th className="px-4 py-2.5">Contact Name</th>
                <th className="px-4 py-2.5">Channel</th>
                <th className="px-4 py-2.5">Consent Status</th>
                <th className="px-4 py-2.5">Recorded By / Source</th>
                <th className="px-4 py-2.5">Recorded At</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredConsents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No consent records matching your search filter.
                  </td>
                </tr>
              ) : (
                filteredConsents.slice(0, 50).map(c => {
                  const lead = leads.find(l => l.id === c.leadId);
                  const contact = lead ? contacts.find(con => con.id === lead.contactId) : null;
                  const contactName = contact ? `${contact.firstName} ${contact.lastName}` : 'N/A';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-medium text-slate-900">{c.id}</td>
                      <td className="px-4 py-3 font-mono text-purple-700 font-semibold">{c.leadId}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{contactName}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700">
                          {getChannelIcon(c.channel)}
                          <span>{c.channel}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                      <td className="px-4 py-3 text-slate-600 text-[11px]">{c.recordedBy || c.source || 'Web Form'}</td>
                      <td className="px-4 py-3 text-slate-500 text-[11px]">
                        {new Date(c.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => {
                            setModalLeadId(c.leadId);
                            setTargetStatus(c.status === 'OPTED_IN' ? 'OPTED_OUT' : 'OPTED_IN');
                          }}
                          className="px-2.5 py-1 text-[11px] font-bold rounded border border-slate-200 text-purple-700 hover:bg-purple-50 transition-colors cursor-pointer"
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
          <div className="text-center text-xs text-slate-400 py-2">
            Showing first 50 of {filteredConsents.length.toLocaleString()} matching records.
          </div>
        )}
      </div>

      {/* Modify Consent Modal */}
      {modalLeadId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                Update Communication Consent
              </h3>
              <button
                onClick={() => setModalLeadId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Target Lead ID</label>
                <input
                  type="text"
                  readOnly
                  value={modalLeadId}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Channel</label>
                <select
                  value={selectedChannel}
                  onChange={e => setSelectedChannel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="EMAIL">Email</option>
                  <option value="PHONE">Phone</option>
                  <option value="SMS">SMS</option>
                  <option value="ALL">All Channels</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">New Consent Decision</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['OPTED_IN', 'OPTED_OUT', 'WITHDRAWN', 'PENDING'] as ConsentStatus[]).map(st => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setTargetStatus(st)}
                      className={`px-3 py-2 rounded-lg border text-xs font-bold transition-all text-left cursor-pointer ${
                        targetStatus === st
                          ? 'border-purple-600 bg-purple-50 text-purple-900 ring-2 ring-purple-600/20'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {st.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setModalLeadId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateConsent}
                disabled={isUpdating === modalLeadId}
                className="px-4 py-2 rounded-lg bg-purple-700 text-white text-xs font-bold hover:bg-purple-800 disabled:opacity-50 cursor-pointer"
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
