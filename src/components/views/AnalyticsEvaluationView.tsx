import React, { useState } from 'react';
import {
  BarChart3,
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Shield,
  Layers,
  HelpCircle,
  Activity,
  GitBranch,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';

export const AnalyticsEvaluationView: React.FC = () => {
  const { evaluationMetrics, validationReport } = useCRM();

  const [splitMethod, setSplitMethod] = useState<'Chronological (Held-out)' | 'Deterministic Seed (80/20)'>('Chronological (Held-out)');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Scoring Evaluation & ML Benchmark
            </h1>
            <Badge variant="teal" size="md">
              Held-Out Split Engine
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Statistical validation, binary confusion matrix, ROC-AUC, and leak-free chronological evaluation.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Evaluation Split:</span>
          <select
            value={splitMethod}
            onChange={e => setSplitMethod(e.target.value as any)}
            className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 font-semibold text-[#0F172A] dark:text-[#F8FAFC] cursor-pointer focus:outline-none focus:border-[#2563EB]"
          >
            <option value="Chronological (Held-out)">Chronological (Held-out 30%)</option>
            <option value="Deterministic Seed (80/20)">Deterministic Seed (80/20)</option>
          </select>
        </div>
      </div>

      {/* Primary ML Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Precision (Hot Class)</div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] font-mono tabular-nums">
            {(evaluationMetrics.precision * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono">TP / (TP + FP)</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Recall (Sensitivity)</div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] font-mono tabular-nums">
            {(evaluationMetrics.recall * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 font-mono">TP / (TP + FN)</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">F1-Score</div>
          <div className="mt-2 text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6] font-mono tabular-nums">
            {evaluationMetrics.f1Score}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Harmonic Mean</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">ROC-AUC</div>
          <div className="mt-2 text-2xl font-bold text-[#14B8A6] font-mono tabular-nums">
            {evaluationMetrics.rocAuc}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Discrimination Area</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">PR-AUC</div>
          <div className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] font-mono tabular-nums">
            {evaluationMetrics.prAuc}
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Precision-Recall Curve</div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/60 rounded-2xl p-5 text-xs text-[#0F172A] dark:text-[#F8FAFC] space-y-2 leading-relaxed">
        <div className="flex items-center gap-2 font-bold text-[#2563EB] dark:text-[#3B82F6] text-sm">
          <Layers className="w-4 h-4" />
          Deterministic Rule-Based Scoring Engine vs. Empirical Conversion Outcomes
        </div>
        <p className="text-[#64748B] dark:text-[#94A3B8]">
          LEADPULSE AI employs a <strong className="text-[#0F172A] dark:text-[#F8FAFC]">transparent 100-point scoring algorithm</strong> for explainable sales prioritization (Fit, Intent, Engagement). Predictive metrics evaluate the correlation between a prospect achieving a <strong className="text-[#0F172A] dark:text-[#F8FAFC]">HOT (&ge;80 pts)</strong> score classification and their actual progression into a closed-won opportunity within the chronological held-out test split. Future conversion signals and ground truth anomaly labels are strictly segregated to avoid metric inflation.
        </p>
      </div>

      {/* Row 2: Confusion Matrix & Tiered Conversion Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Binary Confusion Matrix</h2>
              <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Positive Class = HOT (&ge;80 pts) · Ground Truth = Converted / Won Deal</p>
            </div>
            <Badge variant="teal">{evaluationMetrics.totalEvaluated} Evaluated</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            {/* TP */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase block">
                True Positives (TP)
              </span>
              <span className="text-3xl font-bold text-emerald-700 dark:text-emerald-400 font-mono block mt-1 tabular-nums">
                {evaluationMetrics.truePositives}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-500 block mt-1">
                Predicted HOT &amp; Converted
              </span>
            </div>

            {/* FP */}
            <div className="bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-rose-800 dark:text-rose-400 uppercase block">
                False Positives (FP)
              </span>
              <span className="text-3xl font-bold text-rose-700 dark:text-rose-400 font-mono block mt-1 tabular-nums">
                {evaluationMetrics.falsePositives}
              </span>
              <span className="text-[11px] text-rose-600 dark:text-rose-500 block mt-1">
                Predicted HOT &amp; Not Converted
              </span>
            </div>

            {/* FN */}
            <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase block">
                False Negatives (FN)
              </span>
              <span className="text-3xl font-bold text-amber-700 dark:text-amber-400 font-mono block mt-1 tabular-nums">
                {evaluationMetrics.falseNegatives}
              </span>
              <span className="text-[11px] text-amber-600 dark:text-amber-500 block mt-1">
                Predicted Cold/Warm &amp; Converted
              </span>
            </div>

            {/* TN */}
            <div className="bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                True Negatives (TN)
              </span>
              <span className="text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] font-mono block mt-1 tabular-nums">
                {evaluationMetrics.trueNegatives}
              </span>
              <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block mt-1">
                Predicted Cold/Warm &amp; Did Not Convert
              </span>
            </div>
          </div>
        </div>

        {/* Tiered Conversion Rates */}
        <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-5">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Conversion Rate by Score Tier</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Verifying that higher scores yield proportional conversion rates</p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-rose-600 dark:text-rose-400 font-bold">HOT Leads (80-100 pts)</span>
                <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                  {evaluationMetrics.hotConversionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#EF4444] h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, evaluationMetrics.hotConversionRate)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block tabular-nums">
                {evaluationMetrics.hotLeadsCount} prospects evaluated
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-amber-600 dark:text-amber-400 font-bold">WARM Leads (50-79 pts)</span>
                <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                  {evaluationMetrics.warmConversionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#F59E0B] h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, evaluationMetrics.warmConversionRate)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block tabular-nums">
                {evaluationMetrics.warmLeadsCount} prospects evaluated
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-blue-600 dark:text-blue-400 font-bold">COLD Leads (0-49 pts)</span>
                <span className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                  {evaluationMetrics.coldConversionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-[#3B82F6] h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, evaluationMetrics.coldConversionRate)}%` }}
                />
              </div>
              <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] block tabular-nums">
                {evaluationMetrics.coldLeadsCount} prospects evaluated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: 12-Point Automated Validation System Health Report */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">12-Point Automated System Integrity Audit</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">Rigorous structural compliance &amp; relational invariant checks</p>
          </div>
          <Badge
            variant={validationReport.overallStatus === 'PASSED' ? 'success' : 'warning'}
            size="md"
          >
            {validationReport.score}% Score ({validationReport.overallStatus})
          </Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase border-b border-[#E2E8F0] dark:border-[#263449]">
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Verification Check</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Result Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70">
              {validationReport.checks.map(check => (
                <tr key={check.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">{check.id}</td>
                  <td className="py-3 px-4 font-bold text-[#0F172A] dark:text-[#F8FAFC]">{check.name}</td>
                  <td className="py-3 px-4 text-[#2563EB] dark:text-[#3B82F6] font-medium">{check.category}</td>
                  <td className="py-3 px-4">
                    <Badge variant={check.status === 'PASSED' ? 'success' : 'warning'}>
                      {check.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4 text-[#64748B] dark:text-[#94A3B8]">{check.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
