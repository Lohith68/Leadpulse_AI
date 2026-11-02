import React, { useState } from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  Sparkles,
  Info,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Anomaly, GroundTruthRecord } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { generateAIAnomalyAnalysis } from '../../services/aiService';

export const AnomalyDetectionView: React.FC = () => {
  const { anomalies, groundTruth, runIntegrityAudit, resolveAnomaly } = useCRM();

  const [isAuditing, setIsAuditing] = useState(false);
  const [selectedAnomalyForAi, setSelectedAnomalyForAi] = useState<Anomaly | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);

  const handleAudit = async () => {
    setIsAuditing(true);
    try {
      await runIntegrityAudit();
    } finally {
      setIsAuditing(false);
    }
  };

  const handleOpenAiAnalysis = async (anom: Anomaly) => {
    setSelectedAnomalyForAi(anom);
    setAiAnalysis(null);
    setIsAnalyzingAi(true);
    try {
      const res = await generateAIAnomalyAnalysis(anom);
      setAiAnalysis(res);
    } finally {
      setIsAnalyzingAi(false);
    }
  };

  const activeCount = anomalies.filter(a => a.status === 'DETECTED').length;
  const blockedCount = anomalies.filter(a => a.status === 'BLOCKED').length;
  const resolvedCount = anomalies.filter(a => a.status === 'RESOLVED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Anomaly Detection &amp; Integrity Auditor
            </h1>
            <Badge variant="danger" size="md">
              {activeCount} Active Issues
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Real-time enforcement of the 5 mandatory integrity vectors with isolated ground-truth separation.
          </p>
        </div>

        <button
          onClick={handleAudit}
          disabled={isAuditing}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer shrink-0"
        >
          <RotateCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          {isAuditing ? 'Scanning Records...' : 'Run Live Integrity Audit'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Active Detected Anomalies</div>
          <div className="mt-2 text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono tabular-nums">{activeCount}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Requiring review or remediation</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Gateway Blocked Violations</div>
          <div className="mt-2 text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6] font-mono tabular-nums">{blockedCount}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Consent &amp; routing security intercepts</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Resolved Audit Records</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">{resolvedCount}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Verified &amp; mitigated events</div>
        </div>
      </div>

      {/* 5 Mandatory Scenarios Specification Card */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl p-6 border border-[#E2E8F0] dark:border-[#263449] shadow-xs space-y-4">
        <h2 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] uppercase tracking-wider">
          Mandatory Negative Integrity Invariants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="bg-[#F8FAFC] dark:bg-[#0B1220] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
            <span className="font-bold text-rose-600 dark:text-rose-400 block text-[11px]">1. Consent Violation</span>
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] block mt-1">OPTED_OUT_LEAD_CONTACTED</span>
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mt-1">Expected: Block &amp; flag GDPR violation</span>
          </div>
          <div className="bg-[#F8FAFC] dark:bg-[#0B1220] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
            <span className="font-bold text-amber-600 dark:text-amber-400 block text-[11px]">2. Temporal Leakage</span>
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] block mt-1">POST_CONVERSION_ACTIVITY</span>
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mt-1">Expected: Exclude from historical score</span>
          </div>
          <div className="bg-[#F8FAFC] dark:bg-[#0B1220] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
            <span className="font-bold text-[#2563EB] dark:text-[#3B82F6] block text-[11px]">3. Routing Breach</span>
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] block mt-1">LEAD_ASSIGNED_OUTSIDE_TERRITORY</span>
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mt-1">Expected: Reject cross-territory assignment</span>
          </div>
          <div className="bg-[#F8FAFC] dark:bg-[#0B1220] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
            <span className="font-bold text-red-600 dark:text-red-400 block text-[11px]">4. Duplicate Deal</span>
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] block mt-1">DUPLICATE_OPPORTUNITY_CREATED</span>
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mt-1">Expected: Single active opp enforcement</span>
          </div>
          <div className="bg-[#F8FAFC] dark:bg-[#0B1220] p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
            <span className="font-bold text-sky-600 dark:text-sky-400 block text-[11px]">5. State Gap</span>
            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] block mt-1">STAGE_HISTORY_GAP</span>
            <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block mt-1">Expected: Enforce sequential audit trail</span>
          </div>
        </div>
      </div>

      {/* Detected Anomalies Table */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] flex items-center justify-between">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Active Detected Anomalies</h2>
          <Badge variant="teal">{anomalies.length} Total Logs</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider border-b border-[#E2E8F0] dark:border-[#263449]">
                <th className="py-3 px-4">Anomaly Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected Record</th>
                <th className="py-3 px-4">Expected Decision</th>
                <th className="py-3 px-4">Actual Attempt</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70 text-[#0F172A] dark:text-[#F8FAFC]">
              {anomalies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#64748B] dark:text-[#94A3B8] font-medium">
                    No anomalies detected. All database invariants verified clean.
                  </td>
                </tr>
              ) : (
                anomalies.map(anom => (
                  <tr key={anom.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold">
                      <div>{anom.type}</div>
                      <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono mt-0.5">{anom.id}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          anom.severity === 'CRITICAL'
                            ? 'danger'
                            : anom.severity === 'HIGH'
                            ? 'warning'
                            : 'neutral'
                        }
                      >
                        {anom.severity}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6]">{anom.affectedRecordId}</span>
                      <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">{anom.affectedEntity}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">
                      {anom.expectedDecision}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-600 dark:text-rose-400 text-[11px]">
                      {anom.actualDecision}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={
                          anom.status === 'BLOCKED'
                            ? 'danger'
                            : anom.status === 'RESOLVED'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {anom.status}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAiAnalysis(anom)}
                          className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#3B82F6] hover:bg-blue-100 font-semibold text-[11px] flex items-center gap-1 transition-colors border border-blue-200 dark:border-blue-900/60 cursor-pointer"
                          title="Run Gemini AI Root Cause Assessment"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Analysis
                        </button>
                        {anom.status !== 'RESOLVED' && (
                          <button
                            onClick={() => resolveAnomaly(anom.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-[11px] transition-colors border border-emerald-200 dark:border-emerald-800 cursor-pointer"
                          >
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ground Truth Isolation Section */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Isolated Ground Truth Benchmark Scenarios
            </h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Strictly segregated from model input features to prevent metric overfitting and data leakage.
            </p>
          </div>
          <Badge variant="neutral">{groundTruth.length} Benchmarks</Badge>
        </div>

        <div className="p-5 space-y-3">
          {groundTruth.map(gt => (
            <div
              key={gt.id}
              className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] flex items-start justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">{gt.id}</span>
                  <span className="font-bold text-[#2563EB] dark:text-[#3B82F6]">{gt.scenarioType}</span>
                  <span className="font-mono text-[11px] text-[#64748B] dark:text-[#94A3B8]">Target: {gt.targetRecordId}</span>
                </div>
                <p className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">{gt.description}</p>
              </div>
              <Badge variant="success">Expected: DETECT</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* AI Root Cause Modal */}
      <Modal
        isOpen={!!selectedAnomalyForAi}
        onClose={() => setSelectedAnomalyForAi(null)}
        title="Gemini AI Root Cause Assessment"
        subtitle={`Incident Analysis for ${selectedAnomalyForAi?.type} [${selectedAnomalyForAi?.affectedRecordId}]`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {isAnalyzingAi ? (
            <div className="py-8 text-center text-[#64748B] dark:text-[#94A3B8] flex flex-col items-center gap-2">
              <RotateCw className="w-5 h-5 animate-spin text-[#2563EB]" />
              <span>Analyzing incident vectors with Gemini AI...</span>
            </div>
          ) : (
            <div className="bg-[#F8FAFC] dark:bg-[#0B1220] p-4 rounded-xl border border-[#E2E8F0] dark:border-[#263449] whitespace-pre-line text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed font-sans max-h-96 overflow-y-auto">
              {aiAnalysis}
            </div>
          )}

          <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#263449] flex justify-end">
            <button
              onClick={() => setSelectedAnomalyForAi(null)}
              className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold transition-colors"
            >
              Close Assessment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
