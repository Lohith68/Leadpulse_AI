import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCw,
  Download,
  FileCheck2,
  Filter,
  Layers,
  FileCode,
  Search,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import { ValidationCheck } from '../../types/crm';
import { downloadFile } from '../../services/exportService';

export const ValidationCenterView: React.FC = () => {
  const { validationReport, refreshValidation, leads, companies, contacts, opportunities } = useCRM();
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCheck, setSelectedCheck] = useState<ValidationCheck | null>(null);

  const categories = Array.from(new Set(validationReport.checks.map(c => c.category)));

  const filteredChecks = validationReport.checks.filter(c => {
    const matchesCategory = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const passedCount = validationReport.checks.filter(c => c.status === 'PASSED').length;
  const failedCount = validationReport.checks.filter(c => c.status === 'FAILED').length;
  const totalChecks = validationReport.checks.length;
  const healthScore = totalChecks > 0 ? Math.round((passedCount / totalChecks) * 100) : 100;

  const handleExportReportMarkdown = () => {
    const md = `# LEADPULSE AI - FORMAL SYSTEM VALIDATION REPORT
Generated: ${new Date(validationReport.timestamp).toISOString()}
Overall Status: ${validationReport.overallStatus}
Health Score: ${healthScore}% (${passedCount}/${totalChecks} Checks Passed)

## EXECUTIVE SUMMARY
This formal validation report certifies the structural, relational, and business rule integrity of the LEADPULSE AI CRM application. All checks are executed against actual in-memory and database records.

| Check ID | Verification Dimension | Category | Status | Passed Records | Failed Records | Details |
|---|---|---|---|---|---|---|
${validationReport.checks
  .map(
    c =>
      `| ${c.id} | ${c.name} | ${c.category} | ${c.status} | ${c.passedCount} | ${c.failedCount} | ${c.message} |`
  )
  .join('\n')}

## AUDITED ENTITY COUNTS
- Companies: ${companies.length}
- Contacts: ${contacts.length}
- Leads: ${leads.length}
- Opportunities: ${opportunities.length}

---
*Report certified by LEADPULSE AI Validation Engine.*
`;
    downloadFile(md, 'leadpulse_system_validation_report.md', 'text/markdown');
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">System Validation Center</h1>
            <Badge variant={validationReport.overallStatus === 'PASSED' ? 'success' : 'danger'}>
              {validationReport.overallStatus}
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Real-time verification matrix auditing 12 core relational, algorithmic, and governance invariants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshValidation()}
            className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5 text-[#2563EB]" />
            Re-Run Checks
          </button>
          <button
            onClick={handleExportReportMarkdown}
            className="px-4 py-2 rounded-xl bg-[#2563EB] text-white hover:bg-[#1D4ED8] text-xs font-semibold shadow-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export Validation Report
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Overall System Health</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">{healthScore}%</span>
            <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Compliant</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${healthScore === 100 ? 'bg-[#16A34A]' : 'bg-[#F59E0B]'}`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Passed Invariants</div>
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{passedCount}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">Out of {totalChecks} core invariants</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Failed Invariants</div>
          <div className="text-3xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{failedCount}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">{failedCount === 0 ? 'Zero regressions detected' : 'Requires review'}</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Last Executed</div>
          <div className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-2 font-mono tabular-nums">
            {new Date(validationReport.timestamp).toLocaleTimeString()}
          </div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Real-time Invariant Probe</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search validation checks by name, ID, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] rounded-xl text-xs focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-[#64748B] dark:text-[#94A3B8] shrink-0" />
            <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#2563EB] text-white font-semibold'
                    : 'bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A]'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#2563EB] text-white font-semibold'
                      : 'bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Checks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredChecks.map(check => {
            const isPassed = check.status === 'PASSED';
            return (
              <div
                key={check.id}
                onClick={() => setSelectedCheck(check)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-xs ${
                  isPassed
                    ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-900/40 hover:border-emerald-400'
                    : 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-200/80 dark:border-rose-900/40 hover:border-rose-400'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8]">{check.id}</span>
                        <h3 className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">{check.name}</h3>
                      </div>
                      <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1 leading-relaxed">{check.message}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase shrink-0 ${
                      isPassed ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] border-t border-[#E2E8F0]/70 dark:border-[#263449]/70 pt-3 mt-3">
                  <span className="font-medium text-[#2563EB] dark:text-[#3B82F6]">{check.category}</span>
                  <div className="flex items-center gap-3 font-mono text-[10px] tabular-nums">
                    <span className="text-emerald-600 dark:text-emerald-400">Passed: {check.passedCount.toLocaleString()}</span>
                    {check.failedCount > 0 && (
                      <span className="text-rose-600 dark:text-rose-400 font-bold">Failed: {check.failedCount.toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Check Details Modal */}
      {selectedCheck && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-[#E2E8F0] dark:border-[#263449] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#263449] pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {selectedCheck.id}: {selectedCheck.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCheck(null)}
                className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#0F172A] dark:text-[#F8FAFC]">
              <div className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Validation Category</span>
                <span className="font-medium text-[#0F172A] dark:text-[#F8FAFC]">{selectedCheck.category}</span>
              </div>

              <div className="flex justify-between p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449]">
                <span className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Check Status</span>
                <span
                  className={`font-bold ${selectedCheck.status === 'PASSED' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
                >
                  {selectedCheck.status}
                </span>
              </div>

              <div className="p-3 bg-[#F8FAFC] dark:bg-[#0B1220] rounded-xl border border-[#E2E8F0] dark:border-[#263449] space-y-1">
                <div className="font-semibold text-[#64748B] dark:text-[#94A3B8]">Verification Result Summary</div>
                <div className="text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed">{selectedCheck.message}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-400">Passed Records</div>
                  <div className="text-xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                    {selectedCheck.passedCount.toLocaleString()}
                  </div>
                </div>
                <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-xl">
                  <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400">Failed Records</div>
                  <div className="text-xl font-bold text-rose-700 dark:text-rose-400 mt-1 tabular-nums">
                    {selectedCheck.failedCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
              <button
                onClick={() => setSelectedCheck(null)}
                className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-xs font-semibold transition-colors"
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
