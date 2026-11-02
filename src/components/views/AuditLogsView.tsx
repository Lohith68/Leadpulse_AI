import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Download,
  ShieldAlert,
  GitCommit,
  ShieldCheck,
  CheckSquare,
  Clock,
  Layers,
  Eye,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { downloadFile } from '../../services/exportService';

interface UnifiedAuditEntry {
  id: string;
  timestamp: string;
  category: 'STAGE_TRANSITION' | 'CONSENT_DECISION' | 'ANOMALY_FLAG' | 'TASK_ACTION' | 'SCORE_EVENT';
  entityId: string;
  actor: string;
  action: string;
  details: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
}

export const AuditLogsView: React.FC = () => {
  const { stageHistories, consents, anomalies, tasks, leads } = useCRM();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [selectedEntry, setSelectedEntry] = useState<UnifiedAuditEntry | null>(null);

  // Aggregate unified chronological audit entries
  const auditEntries = useMemo(() => {
    const list: UnifiedAuditEntry[] = [];

    // 1. Stage Histories
    stageHistories.forEach(s => {
      list.push({
        id: s.id,
        timestamp: s.timestamp || new Date().toISOString(),
        category: 'STAGE_TRANSITION',
        entityId: s.opportunityId,
        actor: s.changedBy || 'System Automation',
        action: `Stage transitioned from ${s.fromStage} to ${s.toStage}`,
        details: s.transitionReason || `Duration in previous stage: ${s.durationDays} days.`,
        severity: s.toStage === 'LOST' ? 'WARNING' : s.toStage === 'WON' ? 'INFO' : 'INFO',
      });
    });

    // 2. Consents
    consents.forEach(c => {
      list.push({
        id: c.id,
        timestamp: c.timestamp || new Date().toISOString(),
        category: 'CONSENT_DECISION',
        entityId: c.leadId,
        actor: c.recordedBy || 'Privacy Sentinel',
        action: `Consent ${c.status} for ${c.channel}`,
        details: c.notes || `Source: ${c.source || 'WEB_FORM'}`,
        severity: c.status === 'OPTED_OUT' || c.status === 'WITHDRAWN' ? 'WARNING' : 'INFO',
      });
    });

    // 3. Anomalies
    anomalies.forEach(a => {
      list.push({
        id: a.id,
        timestamp: a.timestamp || new Date().toISOString(),
        category: 'ANOMALY_FLAG',
        entityId: a.affectedRecordId || 'N/A',
        actor: 'Rule-Based Anomaly Sentinel',
        action: `Detected ${a.type}`,
        details: a.details || `${a.expectedDecision} vs ${a.actualDecision}`,
        severity: a.severity === 'CRITICAL' ? 'CRITICAL' : a.severity === 'HIGH' ? 'WARNING' : 'INFO',
      });
    });

    // 4. Tasks
    tasks.forEach(t => {
      list.push({
        id: t.id,
        timestamp: t.createdAt || new Date().toISOString(),
        category: 'TASK_ACTION',
        entityId: t.leadId,
        actor: 'SLA Engine',
        action: `Task created: ${t.title} [Priority: ${t.priority}]`,
        details: `Assigned Rep: ${t.assignedRepId || 'Round Robin'} - Due in ${t.dueBusinessDays || 1} day(s)`,
        severity: t.priority === 'URGENT_1_DAY' ? 'WARNING' : 'INFO',
      });
    });

    // 5. Scored Leads
    leads.slice(0, 100).forEach(l => {
      list.push({
        id: `AUD-SCR-${l.id}`,
        timestamp: l.lastScoredAt || l.createdAt || new Date().toISOString(),
        category: 'SCORE_EVENT',
        entityId: l.id,
        actor: 'Deterministic 100-Pt Engine',
        action: `Scored ${l.totalScore}/100 (${l.scoreCategory})`,
        details: `Fit: ${l.fitScore}/30, Intent: ${l.intentScore}/40, Engagement: ${l.engagementScore}/30`,
        severity: l.scoreCategory === 'HOT' ? 'INFO' : 'INFO',
      });
    });

    // Sort descending by timestamp
    return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [stageHistories, consents, anomalies, tasks, leads]);

  // Filtered audit list
  const filteredEntries = auditEntries.filter(entry => {
    const matchesCategory = categoryFilter === 'ALL' || entry.category === categoryFilter;
    const matchesSeverity = severityFilter === 'ALL' || entry.severity === severityFilter;
    const matchesSearch =
      entry.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entityId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.actor.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSeverity && matchesSearch;
  });

  const handleExportCSV = () => {
    const headers = ['Audit ID', 'Timestamp', 'Category', 'Entity Reference', 'Actor', 'Action', 'Severity', 'Details'];
    const rows = filteredEntries.map(e => [
      `"${e.id}"`,
      `"${e.timestamp}"`,
      `"${e.category}"`,
      `"${e.entityId}"`,
      `"${e.actor}"`,
      `"${e.action.replace(/"/g, '""')}"`,
      `"${e.severity}"`,
      `"${e.details.replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    downloadFile(csvContent, 'leadpulse_system_audit_log.csv', 'text/csv');
  };

  const getCategoryIcon = (category: UnifiedAuditEntry['category']) => {
    switch (category) {
      case 'STAGE_TRANSITION':
        return <GitCommit className="w-3.5 h-3.5 text-[#2563EB]" />;
      case 'CONSENT_DECISION':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case 'ANOMALY_FLAG':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      case 'TASK_ACTION':
        return <CheckSquare className="w-3.5 h-3.5 text-amber-500" />;
      case 'SCORE_EVENT':
      default:
        return <Layers className="w-3.5 h-3.5 text-[#14B8A6]" />;
    }
  };

  const getSeverityBadge = (severity: UnifiedAuditEntry['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return <Badge variant="danger">CRITICAL</Badge>;
      case 'WARNING':
        return <Badge variant="warning">WARNING</Badge>;
      case 'INFO':
      default:
        return <Badge variant="neutral">INFO</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">System Audit &amp; Event Logs</h1>
            <Badge variant="teal">Immutable Ledger</Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Chronological, cryptographically traceable event log recording consent decisions, stage shifts, anomaly flags, and pipeline automation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            Export Audit Log (CSV)
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Audit Events</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{auditEntries.length.toLocaleString()}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Aggregate Event Trace</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Stage Transitions</div>
          <div className="text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6] mt-1 tabular-nums">{stageHistories.length.toLocaleString()}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Opportunity Milestones</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Privacy &amp; Consents</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{consents.length.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Compliance Ledger Records</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Anomaly Detections</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{anomalies.length.toLocaleString()}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Sentinel Audit Triggers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by event ID, entity ID, action, or actor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1220] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Event Types</option>
              <option value="STAGE_TRANSITION">Stage Transitions</option>
              <option value="CONSENT_DECISION">Consent Decisions</option>
              <option value="ANOMALY_FLAG">Anomaly Detections</option>
              <option value="TASK_ACTION">Task Lifecycle</option>
              <option value="SCORE_EVENT">Score Recalculations</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] ml-2">
              <span>Severity:</span>
            </div>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1220] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#263449] rounded-xl">
          <table className="w-full text-left text-xs text-[#0F172A] dark:text-[#F8FAFC]">
            <thead className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase border-b border-[#E2E8F0] dark:border-[#263449]">
              <tr>
                <th className="px-4 py-3">Audit ID</th>
                <th className="px-4 py-3">Timestamp</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Entity Reference</th>
                <th className="px-4 py-3">Actor</th>
                <th className="px-4 py-3">Action &amp; Narrative</th>
                <th className="px-4 py-3">Severity</th>
                <th className="px-4 py-3 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-[#64748B] dark:text-[#94A3B8]">
                    No audit records matching your search filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.slice(0, 50).map(entry => (
                  <tr key={entry.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-medium">{entry.id}</td>
                    <td className="px-4 py-3.5 text-[#64748B] dark:text-[#94A3B8] text-[11px] whitespace-nowrap tabular-nums">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 font-medium">
                        {getCategoryIcon(entry.category)}
                        <span className="text-[11px]">{entry.category.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-[#2563EB] dark:text-[#3B82F6] font-semibold">{entry.entityId}</td>
                    <td className="px-4 py-3.5 text-[#64748B] dark:text-[#94A3B8] text-[11px]">{entry.actor}</td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold">{entry.action}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate max-w-xs">{entry.details}</div>
                    </td>
                    <td className="px-4 py-3.5">{getSeverityBadge(entry.severity)}</td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white transition-colors cursor-pointer"
                        title="Inspect Event"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredEntries.length > 50 && (
          <div className="text-center text-xs text-[#64748B] dark:text-[#94A3B8] py-2">
            Showing first 50 of {filteredEntries.length.toLocaleString()} matching records.
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#E2E8F0] dark:border-[#263449] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#263449] pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Audit Record Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-[#0F172A] dark:text-[#F8FAFC]">
              <div className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Record ID</span>
                <span className="font-mono font-bold">{selectedEntry.id}</span>
              </div>

              <div className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Timestamp</span>
                <span className="font-mono text-[#64748B] dark:text-[#94A3B8] tabular-nums">{new Date(selectedEntry.timestamp).toISOString()}</span>
              </div>

              <div className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Category &amp; Severity</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{selectedEntry.category}</span>
                  {getSeverityBadge(selectedEntry.severity)}
                </div>
              </div>

              <div className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Entity Reference</span>
                <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{selectedEntry.entityId}</span>
              </div>

              <div className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Originating Actor</span>
                <span className="font-medium">{selectedEntry.actor}</span>
              </div>

              <div className="p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449] space-y-1">
                <div className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Action Narrative</div>
                <div className="font-medium">{selectedEntry.action}</div>
                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">{selectedEntry.details}</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
