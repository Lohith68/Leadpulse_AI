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
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';

export const AnalyticsEvaluationView: React.FC = () => {
  const { evaluationMetrics, validationReport } = useCRM();

  const [splitMethod, setSplitMethod] = useState<'Chronological (Held-out)' | 'Deterministic Seed (80/20)'>('Chronological (Held-out)');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Scoring Evaluation & ML Benchmark
            </h1>
            <Badge variant="purple" size="md">
              Held-Out Split Engine
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Statistical validation, confusion matrix, ROC-AUC, and leak-free chronological evaluation
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Evaluation Split:</span>
          <select
            value={splitMethod}
            onChange={e => setSplitMethod(e.target.value as any)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 cursor-pointer focus:outline-none"
          >
            <option value="Chronological (Held-out)">Chronological (Held-out 30%)</option>
            <option value="Deterministic Seed (80/20)">Deterministic Seed (80/20)</option>
          </select>
        </div>
      </div>

      {/* Primary ML Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">Precision (Hot Class)</div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {(evaluationMetrics.precision * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">TP / (TP + FP)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">Recall (Sensitivity)</div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {(evaluationMetrics.recall * 100).toFixed(1)}%
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">TP / (TP + FN)</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">F1-Score</div>
          <div className="mt-2 text-2xl font-black text-purple-700 font-mono">
            {evaluationMetrics.f1Score}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Harmonic Mean</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">ROC-AUC</div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {evaluationMetrics.rocAuc}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Discrimination Area</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-semibold text-slate-400">PR-AUC</div>
          <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
            {evaluationMetrics.prAuc}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Precision-Recall Curve</div>
        </div>
      </div>

      {/* Distinction Banner: Rule-Based vs Predictive */}
      <div className="bg-purple-50/70 border border-purple-200/80 rounded-xl p-4 text-xs text-purple-950 space-y-1.5 leading-relaxed">
        <div className="flex items-center gap-1.5 font-bold text-purple-900 text-sm">
          <Layers className="w-4 h-4 text-purple-700" />
          Rule-Based Scoring Engine vs. Empirical Conversion Outcomes
        </div>
        <p>
          LEADPULSE AI employs a <strong>deterministic, rule-based 100-point scoring algorithm</strong> for operational transparency and auditability (Fit, Intent, Engagement). Predictive metrics (Precision, Recall, ROC-AUC, PR-AUC) evaluate the correlation between a prospect achieving a <strong>HOT (&ge;80 pts)</strong> score classification and their actual progression into a closed-won opportunity within the chronological held-out test split. Future conversion signals and ground truth anomaly labels are strictly segregated to avoid metric inflation.
        </p>
      </div>

      {/* Row 2: Confusion Matrix & Tiered Conversion Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Confusion Matrix */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Binary Confusion Matrix</h2>
              <p className="text-xs text-slate-400">Positive Class = HOT (&ge;80 pts) | Ground Truth = Converted / Won Deal</p>
            </div>
            <Badge variant="purple">{evaluationMetrics.totalEvaluated} Evaluated</Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            {/* TP */}
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                True Positives (TP)
              </span>
              <span className="text-3xl font-black text-emerald-700 font-mono block mt-1">
                {evaluationMetrics.truePositives}
              </span>
              <span className="text-[11px] text-emerald-600 block mt-1">
                Predicted HOT &amp; Converted
              </span>
            </div>

            {/* FP */}
            <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">
                False Positives (FP)
              </span>
              <span className="text-3xl font-black text-rose-700 font-mono block mt-1">
                {evaluationMetrics.falsePositives}
              </span>
              <span className="text-[11px] text-rose-600 block mt-1">
                Predicted HOT &amp; Not Converted
              </span>
            </div>

            {/* FN */}
            <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-amber-800 uppercase block">
                False Negatives (FN)
              </span>
              <span className="text-3xl font-black text-amber-700 font-mono block mt-1">
                {evaluationMetrics.falseNegatives}
              </span>
              <span className="text-[11px] text-amber-600 block mt-1">
                Predicted Cold/Warm &amp; Converted
              </span>
            </div>

            {/* TN */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl">
              <span className="text-[10px] font-bold text-slate-700 uppercase block">
                True Negatives (TN)
              </span>
              <span className="text-3xl font-black text-slate-800 font-mono block mt-1">
                {evaluationMetrics.trueNegatives}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                Predicted Cold/Warm &amp; Did Not Convert
              </span>
            </div>
          </div>
        </div>

        {/* Tiered Conversion Rates */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Conversion Rate by Score Category</h2>
            <p className="text-xs text-slate-400">Verifying that higher scores yield proportional conversion outcomes</p>
          </div>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="text-rose-700 font-bold">HOT Leads (80-100 pts)</span>
                <span className="font-mono font-bold text-slate-900">
                  {evaluationMetrics.hotConversionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-rose-600 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, evaluationMetrics.hotConversionRate)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {evaluationMetrics.hotLeadsCount} prospects evaluated
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="text-amber-700 font-bold">WARM Leads (50-79 pts)</span>
                <span className="font-mono font-bold text-slate-900">
                  {evaluationMetrics.warmConversionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-amber-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, evaluationMetrics.warmConversionRate)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {evaluationMetrics.warmLeadsCount} prospects evaluated
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span className="text-slate-600 font-bold">COLD Leads (0-49 pts)</span>
                <span className="font-mono font-bold text-slate-900">
                  {evaluationMetrics.coldConversionRate}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-slate-500 h-3 rounded-full transition-all"
                  style={{ width: `${Math.min(100, evaluationMetrics.coldConversionRate)}%` }}
                />
              </div>
              <span className="text-[10px] text-slate-400 block">
                {evaluationMetrics.coldLeadsCount} prospects evaluated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: 12-Point Automated Validation System Health Report */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900">12-Point Automated System Integrity Audit</h2>
            <p className="text-xs text-slate-400">Rigorous structural compliance &amp; relational invariant checks</p>
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
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-4">Audit ID</th>
                <th className="py-2.5 px-4">Verification Check</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Result Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {validationReport.checks.map(check => (
                <tr key={check.id} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-700">{check.id}</td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">{check.name}</td>
                  <td className="py-2.5 px-4 text-purple-700 font-medium">{check.category}</td>
                  <td className="py-2.5 px-4">
                    <Badge variant={check.status === 'PASSED' ? 'success' : 'warning'}>
                      {check.status}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">{check.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
