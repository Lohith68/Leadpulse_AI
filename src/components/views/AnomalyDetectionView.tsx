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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Anomaly Detection & Integrity Auditor
            </h1>
            <Badge variant="danger" size="md">
              {activeCount} Active Issues
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time enforcement of the 5 mandatory integrity vectors with isolated ground-truth separation
          </p>
        </div>

        <button
          onClick={handleAudit}
          disabled={isAuditing}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
        >
          <RotateCw className={`w-4 h-4 ${isAuditing ? 'animate-spin' : ''}`} />
          {isAuditing ? 'Scanning Records...' : 'Run Live Integrity Audit'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Active Detected Anomalies</div>
          <div className="mt-2 text-2xl font-black text-rose-600 font-mono">{activeCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Requiring review or remediation</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Gateway Blocked Violations</div>
          <div className="mt-2 text-2xl font-black text-purple-700 font-mono">{blockedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Consent & routing security intercepts</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-500">Resolved Audit Records</div>
          <div className="mt-2 text-2xl font-black text-emerald-600 font-mono">{resolvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified & mitigated events</div>
        </div>
      </div>

      {/* 5 Mandatory Scenarios Specification Card */}
      <div className="bg-slate-50/80 rounded-xl p-5 border border-slate-200 space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Mandatory Negative Integrity Invariants
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-rose-700 block text-[11px]">1. Consent Violation</span>
            <span className="font-semibold text-slate-900 block mt-0.5">OPTED_OUT_LEAD_CONTACTED</span>
            <span className="text-[10px] text-slate-500 block mt-1">Expected: Block & flag GDPR/CCPA violation</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-amber-700 block text-[11px]">2. Temporal Leakage</span>
            <span className="font-semibold text-slate-900 block mt-0.5">POST_CONVERSION_ACTIVITY</span>
            <span className="text-[10px] text-slate-500 block mt-1">Expected: Exclude from historical score</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-purple-700 block text-[11px]">3. Routing Breach</span>
            <span className="font-semibold text-slate-900 block mt-0.5">LEAD_ASSIGNED_OUTSIDE_TERRITORY</span>
            <span className="text-[10px] text-slate-500 block mt-1">Expected: Reject cross-territory assignment</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-red-700 block text-[11px]">4. Duplicate Deal</span>
            <span className="font-semibold text-slate-900 block mt-0.5">DUPLICATE_OPPORTUNITY_CREATED</span>
            <span className="text-[10px] text-slate-500 block mt-1">Expected: Single active opp enforcement</span>
          </div>
          <div className="bg-white p-3 rounded-lg border border-slate-200">
            <span className="font-bold text-blue-700 block text-[11px]">5. State Gap</span>
            <span className="font-semibold text-slate-900 block mt-0.5">STAGE_HISTORY_GAP</span>
            <span className="text-[10px] text-slate-500 block mt-1">Expected: Enforce sequential audit trail</span>
          </div>
        </div>
      </div>

      {/* Detected Anomalies Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Active Detected Anomalies</h2>
          <Badge variant="purple">{anomalies.length} Total Logs</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Anomaly Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected Record</th>
                <th className="py-3 px-4">Expected Decision</th>
                <th className="py-3 px-4">Actual Attempt</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {anomalies.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    No anomalies detected. All database invariants verified clean.
                  </td>
                </tr>
              ) : (
                anomalies.map(anom => (
                  <tr key={anom.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      <div>{anom.type}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{anom.id}</div>
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-purple-700">{anom.affectedRecordId}</span>
                      <div className="text-[11px] text-slate-400">{anom.affectedEntity}</div>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-700 text-[11px]">
                      {anom.expectedDecision}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-rose-700 text-[11px]">
                      {anom.actualDecision}
                    </td>
                    <td className="py-3 px-4">
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
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAiAnalysis(anom)}
                          className="px-2 py-1 rounded bg-purple-50 text-purple-700 hover:bg-purple-100 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                          title="Run Gemini AI Root Cause Assessment"
                        >
                          <Sparkles className="w-3 h-3" />
                          AI Analysis
                        </button>
                        {anom.status !== 'RESOLVED' && (
                          <button
                            onClick={() => resolveAnomaly(anom.id)}
                            className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition-colors"
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
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Isolated Ground Truth Benchmark Scenarios
            </h2>
            <p className="text-xs text-slate-500">
              Strictly segregated from model input features to prevent metric overfitting and data leakage
            </p>
          </div>
          <Badge variant="neutral">{groundTruth.length} Benchmarks</Badge>
        </div>

        <div className="p-4 space-y-2.5">
          {groundTruth.map(gt => (
            <div
              key={gt.id}
              className="p-3 rounded-lg border border-slate-100 bg-slate-50/60 flex items-start justify-between text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-700">{gt.id}</span>
                  <span className="font-bold text-purple-800">{gt.scenarioType}</span>
                  <span className="font-mono text-[11px] text-slate-400">Target: {gt.targetRecordId}</span>
                </div>
                <p className="text-slate-600 text-[11px]">{gt.description}</p>
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
            <div className="py-8 text-center text-slate-500 flex flex-col items-center gap-2">
              <RotateCw className="w-5 h-5 animate-spin text-purple-600" />
              <span>Analyzing incident vectors with Gemini AI...</span>
            </div>
          ) : (
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-line text-slate-800 leading-relaxed font-sans max-h-96 overflow-y-auto">
              {aiAnalysis}
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => setSelectedAnomalyForAi(null)}
              className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-semibold"
            >
              Close Assessment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
