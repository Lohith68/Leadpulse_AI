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
        return <GitCommit className="w-3.5 h-3.5 text-blue-500" />;
      case 'CONSENT_DECISION':
        return <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />;
      case 'ANOMALY_FLAG':
        return <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
      case 'TASK_ACTION':
        return <CheckSquare className="w-3.5 h-3.5 text-amber-500" />;
      case 'SCORE_EVENT':
      default:
        return <Layers className="w-3.5 h-3.5 text-purple-500" />;
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Audit &amp; Event Logs</h1>
            <Badge variant="purple">Immutable Ledger</Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Chronological, cryptographically traceable event log recording consent decisions, stage shifts, anomaly flags, and pipeline automation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Audit Log (CSV)
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Audit Events</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{auditEntries.length.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Aggregate event trace</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Stage Transitions</div>
          <div className="text-2xl font-black text-blue-700 mt-1">{stageHistories.length.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Opportunity milestones</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Privacy &amp; Consents</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">{consents.length.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Compliance ledger records</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Anomaly Detections</div>
          <div className="text-2xl font-black text-rose-700 mt-1">{anomalies.length.toLocaleString()}</div>
          <div className="text-[10px] text-slate-400 mt-1">Sentinel audit triggers</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by event ID, entity ID, action, or actor..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Filter className="w-3.5 h-3.5" />
              <span>Category:</span>
            </div>
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="ALL">All Event Types</option>
              <option value="STAGE_TRANSITION">Stage Transitions</option>
              <option value="CONSENT_DECISION">Consent Decisions</option>
              <option value="ANOMALY_FLAG">Anomaly Detections</option>
              <option value="TASK_ACTION">Task Lifecycle</option>
              <option value="SCORE_EVENT">Score Recalculations</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-2">
              <span>Severity:</span>
            </div>
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white"
            >
              <option value="ALL">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase border-b border-slate-200">
              <tr>
                <th className="px-4 py-2.5">Audit ID</th>
                <th className="px-4 py-2.5">Timestamp</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">Entity Reference</th>
                <th className="px-4 py-2.5">Actor</th>
                <th className="px-4 py-2.5">Action &amp; Narrative</th>
                <th className="px-4 py-2.5">Severity</th>
                <th className="px-4 py-2.5 text-right">View</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-slate-400">
                    No audit records matching your search filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.slice(0, 50).map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-medium text-slate-900">{entry.id}</td>
                    <td className="px-4 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        {getCategoryIcon(entry.category)}
                        <span className="text-[11px]">{entry.category.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-purple-700 font-semibold">{entry.entityId}</td>
                    <td className="px-4 py-3 text-slate-700 text-[11px]">{entry.actor}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{entry.action}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-xs">{entry.details}</div>
                    </td>
                    <td className="px-4 py-3">{getSeverityBadge(entry.severity)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedEntry(entry)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
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
          <div className="text-center text-xs text-slate-400 py-2">
            Showing first 50 of {filteredEntries.length.toLocaleString()} matching records.
          </div>
        )}
      </div>

      {/* Audit Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Audit Record Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedEntry(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Record ID</span>
                <span className="font-mono font-bold text-slate-900">{selectedEntry.id}</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Timestamp</span>
                <span className="font-mono text-slate-800">{new Date(selectedEntry.timestamp).toISOString()}</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Category &amp; Severity</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-700">{selectedEntry.category}</span>
                  {getSeverityBadge(selectedEntry.severity)}
                </div>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Entity Reference</span>
                <span className="font-mono font-bold text-purple-700">{selectedEntry.entityId}</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Originating Actor</span>
                <span className="font-medium text-slate-900">{selectedEntry.actor}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div className="font-semibold text-slate-500">Action Narrative</div>
                <div className="font-medium text-slate-900">{selectedEntry.action}</div>
                <div className="text-[11px] text-slate-600 mt-1 leading-relaxed">{selectedEntry.details}</div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedEntry(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
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
