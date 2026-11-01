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

  const handleExportReportJSON = () => {
    downloadFile(
      JSON.stringify(validationReport, null, 2),
      'leadpulse_validation_report.json',
      'application/json'
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">System Validation Center</h1>
            <Badge variant={validationReport.overallStatus === 'PASSED' ? 'success' : 'danger'}>
              {validationReport.overallStatus}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time verification matrix testing 12 core relational, algorithmic, and governance invariants.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshValidation()}
            className="px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
            Re-Run Invariant Checks
          </button>
          <button
            onClick={handleExportReportMarkdown}
            className="px-3.5 py-2 rounded-lg bg-purple-700 text-white hover:bg-purple-800 text-xs font-bold shadow-sm flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Validation Report (MD)
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Overall Integrity</div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900">{healthScore}%</span>
            <span className="text-xs text-slate-500 font-medium">Compliance</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
            <div
              className={`h-1.5 rounded-full ${healthScore === 100 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${healthScore}%` }}
            />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Passed Checks</div>
          <div className="text-3xl font-black text-emerald-700 mt-1">{passedCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">Out of {totalChecks} core invariants</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Failed Checks</div>
          <div className="text-3xl font-black text-rose-700 mt-1">{failedCount}</div>
          <div className="text-[10px] text-slate-400 mt-1">{failedCount === 0 ? 'Zero regression detected' : 'Requires resolution'}</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">Last Executed</div>
          <div className="text-xs font-bold text-slate-800 mt-2 font-mono">
            {new Date(validationReport.timestamp).toLocaleTimeString()}
          </div>
          <div className="text-[10px] text-slate-400 mt-1">Automated execution</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search validation checks by name, ID, or description..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <div className="flex gap-1 overflow-x-auto pb-1 max-w-full">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                  selectedCategory === 'ALL'
                    ? 'bg-purple-700 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All Categories
              </button>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium shrink-0 transition-colors ${
                    selectedCategory === cat
                      ? 'bg-purple-700 text-white font-bold'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Checks Grid / Table */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredChecks.map(check => {
            const isPassed = check.status === 'PASSED';
            return (
              <div
                key={check.id}
                onClick={() => setSelectedCheck(check)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                  isPassed
                    ? 'bg-emerald-50/30 border-emerald-200 hover:border-emerald-300'
                    : 'bg-rose-50/30 border-rose-200 hover:border-rose-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    {isPassed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-slate-400">{check.id}</span>
                        <h3 className="text-xs font-bold text-slate-900">{check.name}</h3>
                      </div>
                      <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{check.message}</p>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[10px] font-black rounded uppercase shrink-0 ${
                      isPassed ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-200/60 pt-2.5 mt-3">
                  <span className="font-medium text-slate-400">{check.category}</span>
                  <div className="flex items-center gap-3 font-mono text-[10px]">
                    <span className="text-emerald-700">Passed: {check.passedCount.toLocaleString()}</span>
                    {check.failedCount > 0 && (
                      <span className="text-rose-700 font-bold">Failed: {check.failedCount.toLocaleString()}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-5 h-5 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  {selectedCheck.id}: {selectedCheck.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedCheck(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Validation Category</span>
                <span className="font-medium text-slate-900">{selectedCheck.category}</span>
              </div>

              <div className="flex justify-between p-2.5 bg-slate-50 rounded-lg">
                <span className="font-semibold text-slate-500">Check Status</span>
                <span
                  className={`font-black ${selectedCheck.status === 'PASSED' ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {selectedCheck.status}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-1">
                <div className="font-semibold text-slate-500">Verification Result Summary</div>
                <div className="text-slate-800 leading-relaxed">{selectedCheck.message}</div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-emerald-600">Passed Records</div>
                  <div className="text-xl font-black text-emerald-800 mt-1">
                    {selectedCheck.passedCount.toLocaleString()}
                  </div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-lg">
                  <div className="text-[10px] uppercase font-bold text-rose-600">Failed Records</div>
                  <div className="text-xl font-black text-rose-800 mt-1">
                    {selectedCheck.failedCount.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedCheck(null)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
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
