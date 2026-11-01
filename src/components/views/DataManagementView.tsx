import React, { useState } from 'react';
import {
  Database,
  Download,
  Sparkles,
  FileCode,
  FileSpreadsheet,
  FileText,
  ShieldCheck,
  CheckCircle2,
  RotateCw,
  HardDrive,
  Pause,
  Play,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Server,
  ClipboardCheck,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';
import {
  exportEntityAsCSV,
  exportGroundTruthCSV,
  exportFullJSON,
  exportFull20kDatasetJSON,
  generateSQLSchema,
  downloadFile,
  SYNTHETIC_SOURCE_MANIFEST,
} from '../../services/exportService';
import { GeneratorMode, VOLUME_CONFIGS } from '../../services/syntheticDataGenerator';

export const DataManagementView: React.FC = () => {
  const {
    companies,
    contacts,
    leads,
    campaigns,
    activities,
    consents,
    scoreRules,
    salesReps,
    tasks,
    opportunities,
    stageHistories,
    anomalies,
    groundTruth,
    isSeeding,
    isPaused,
    seedingProgress,
    seedDatabase,
    pauseSeeding,
    resumeSeeding,
    cancelSeeding,
    liveServerCounts,
    isVerifyingServer,
    lastVerifiedAt,
    verifyLiveCounts,
    validationReport,
  } = useCRM();

  const [selectedMode, setSelectedMode] = useState<GeneratorMode>('BENCHMARK');
  const [customSize, setCustomSize] = useState<number>(200);
  const [isExporting20k, setIsExporting20k] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'generator' | 'server-verify' | 'validation' | 'export' | 'dictionary' | 'manifest'>('generator');

  const handleExportSQL = () => {
    const ddl = generateSQLSchema();
    downloadFile(ddl, 'leadpulse_cloudsql_schema.sql', 'application/sql');
  };

  const handleExportAllJSON = () => {
    exportFullJSON({
      companies,
      contacts,
      campaigns,
      salesReps,
      scoreRules,
      leads,
      activities,
      consents,
      tasks,
      opportunities,
      stageHistories,
      anomalies,
      groundTruth,
    });
  };

  const handleExport20kSynthetic = async () => {
    setIsExporting20k(true);
    try {
      // Allow UI thread tick then generate and download full 20k dataset
      setTimeout(() => {
        exportFull20kDatasetJSON(20261022);
        setIsExporting20k(false);
      }, 50);
    } catch (e) {
      console.error('Failed to export 20k dataset:', e);
      setIsExporting20k(false);
    }
  };

  const handleTriggerSeed = () => {
    if (selectedMode === 'BENCHMARK') {
      seedDatabase('BENCHMARK');
    } else if (selectedMode === 'FULL') {
      seedDatabase('FULL');
    } else {
      seedDatabase(customSize);
    }
  };

  // List of collections for live count verification
  const collectionsSummary = [
    { key: 'companies', name: 'Companies', inMemory: companies.length, targetFull: 5000, targetBenchmark: 50 },
    { key: 'contacts', name: 'Contacts', inMemory: contacts.length, targetFull: 10000, targetBenchmark: 100 },
    { key: 'leads', name: 'Leads', inMemory: leads.length, targetFull: 20000, targetBenchmark: 200 },
    { key: 'opportunities', name: 'Opportunities', inMemory: opportunities.length, targetFull: 3000, targetBenchmark: 60 },
    { key: 'campaigns', name: 'Campaigns', inMemory: campaigns.length, targetFull: 5, targetBenchmark: 5 },
    { key: 'activities', name: 'Activities', inMemory: activities.length, targetFull: '~40k', targetBenchmark: '~400' },
    { key: 'consents', name: 'Consents', inMemory: consents.length, targetFull: 20000, targetBenchmark: 200 },
    { key: 'tasks', name: 'Follow-up Tasks', inMemory: tasks.length, targetFull: '~16k', targetBenchmark: '~160' },
    { key: 'stageHistories', name: 'Stage Histories', inMemory: stageHistories.length, targetFull: '~6k', targetBenchmark: '~120' },
    { key: 'salesReps', name: 'Sales Reps', inMemory: salesReps.length, targetFull: 8, targetBenchmark: 8 },
    { key: 'scoreRules', name: 'Score Rules', inMemory: scoreRules.length, targetFull: 12, targetBenchmark: 12 },
    { key: 'anomalies', name: 'Detected Anomalies', inMemory: anomalies.length, targetFull: '5+ Scenarios', targetBenchmark: '5+ Scenarios' },
    { key: 'groundTruth', name: 'Ground Truth Records', inMemory: groundTruth.length, targetFull: 'Isolated', targetBenchmark: 'Isolated' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Data Management & Governance
            </h1>
            <Badge variant="purple" size="md">
              Fixed SEED = 20261022
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Synthetic dataset generator supporting Benchmark (200) & Full (20,000) modes, controlled batch seeding, and independent Firestore verification
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'generator' ? 'bg-white shadow-2xs text-purple-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Generator & Seeder
          </button>
          <button
            onClick={() => setActiveTab('server-verify')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'server-verify' ? 'bg-white shadow-2xs text-emerald-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Live Server Verification
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 ${
              activeTab === 'validation' ? 'bg-white shadow-2xs text-blue-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Validation Report
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'export' ? 'bg-white shadow-2xs text-purple-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Exports
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'dictionary' ? 'bg-white shadow-2xs text-purple-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dictionary
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 rounded-md transition-colors ${
              activeTab === 'manifest' ? 'bg-white shadow-2xs text-purple-700 font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Manifest
          </button>
        </div>
      </div>

      {/* Tab 1: Synthetic Data Generator */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Deterministic Synthetic Generation Engine (Mulberry32 PRNG)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Parent records generated before child records with 100% valid foreign keys, labelled duplicates, opted-out leads, and all 5 mandatory anomaly scenarios
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md border border-slate-200 self-start">
                SEED: 20261022
              </span>
            </div>

            <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 space-y-5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 mb-2">
                  Select Seeding Mode:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BENCHMARK MODE */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('BENCHMARK')}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      selectedMode === 'BENCHMARK'
                        ? 'bg-purple-50/80 border-purple-500 text-purple-950 shadow-xs ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm text-slate-900">BENCHMARK MODE</span>
                      <Badge variant="purple" size="sm">Quick Testing</Badge>
                    </div>
                    <div className="font-mono text-xs text-purple-800 font-bold mb-1">
                      200 Leads • 100 Contacts • 50 Companies • 60 Opportunities
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Instant verification dataset for automated unit tests, fast schema validation, and immediate interactive exploration.
                    </p>
                  </button>

                  {/* FULL MODE */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('FULL')}
                    className={`p-4 rounded-xl border text-left transition-all relative ${
                      selectedMode === 'FULL'
                        ? 'bg-purple-50/80 border-purple-500 text-purple-950 shadow-xs ring-2 ring-purple-500/20'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-black text-sm text-slate-900">FULL MODE</span>
                      <Badge variant="success" size="sm">Full Problem Statement</Badge>
                    </div>
                    <div className="font-mono text-xs text-emerald-800 font-bold mb-1">
                      20,000 Leads • 10,000 Contacts • 5,000 Companies • 3,000 Opportunities
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Complete enterprise scale with all 11 entities, ~40,000 activities, ~16,000 SLA tasks, stage histories, duplicate labels, and isolated ground truth.
                    </p>
                  </button>
                </div>
              </div>

              {/* Progress & Batch Controls during Seeding */}
              {isSeeding && seedingProgress && (
                <div className="p-4 bg-purple-50/90 border border-purple-200 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-bold text-purple-950 text-xs flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-purple-700 animate-spin" />
                      <span>{seedingProgress.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-purple-900 text-sm">
                        {seedingProgress.percentage}%
                      </span>
                      {seedingProgress.totalBatches > 0 && (
                        <span className="text-[11px] font-semibold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                          Batch {seedingProgress.batchIndex} / {seedingProgress.totalBatches}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-purple-200/70 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-purple-700 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, seedingProgress.percentage)}%` }}
                    />
                  </div>

                  {/* Operational Controls: Pause / Resume / Cancel */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-purple-800">
                      Phase: <strong className="uppercase">{seedingProgress.phase}</strong> ({seedingProgress.current.toLocaleString()} / {seedingProgress.total.toLocaleString()} records)
                    </span>
                    <div className="flex items-center gap-2">
                      {isPaused ? (
                        <button
                          type="button"
                          onClick={resumeSeeding}
                          className="px-2.5 py-1 rounded bg-purple-700 text-white font-bold hover:bg-purple-800 flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={pauseSeeding}
                          className="px-2.5 py-1 rounded bg-amber-600 text-white font-bold hover:bg-amber-700 flex items-center gap-1"
                        >
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={cancelSeeding}
                        className="px-2.5 py-1 rounded bg-red-100 text-red-700 font-bold hover:bg-red-200 flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Seeding Action Bar */}
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200">
                <span className="text-slate-500 text-[11px]">
                  Batch writes safe chunking (&le; 300 docs/batch) with exponential backoff retries and idempotent merge keys
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleTriggerSeed}
                    disabled={isSeeding}
                    className="px-6 py-2.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isSeeding
                      ? isPaused
                        ? 'Seeding Paused...'
                        : 'Writing to Cloud Firestore...'
                      : `Seed ${selectedMode} (${selectedMode === 'BENCHMARK' ? '200' : '20,000'} Leads) into Firestore`}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Server Counts Summary Strip */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-700">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Cloud Firestore Persistence Status
                </div>
                <div className="text-[11px] text-slate-500">
                  {lastVerifiedAt ? (
                    <span>Last independently verified at {new Date(lastVerifiedAt).toLocaleTimeString()}</span>
                  ) : (
                    <span>Click verify to independently query counts from Cloud Firestore using getCountFromServer</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => verifyLiveCounts()}
              disabled={isVerifyingServer}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifyingServer ? 'animate-spin' : ''}`} />
              {isVerifyingServer ? 'Querying Firestore Server...' : 'Verify Counts in Cloud Firestore'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Independent Live Server Verification Panel */}
      {activeTab === 'server-verify' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-600" />
                  Independent Cloud Firestore Server Verification (Module 15)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Queries actual persisted documents in Cloud Firestore via <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">getCountFromServer</code> to confirm real storage
                </p>
              </div>

              <button
                onClick={() => verifyLiveCounts()}
                disabled={isVerifyingServer}
                className="px-4 py-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isVerifyingServer ? 'animate-spin' : ''}`} />
                {isVerifyingServer ? 'Querying Cloud Firestore Server...' : 'Query Live Server Counts Now'}
              </button>
            </div>

            {/* Verification Status Header */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">Verification Source:</span>
                <Badge variant="success" size="md">
                  Server-side Aggregation API
                </Badge>
                <span className="text-slate-400">•</span>
                <span className="text-slate-500">Database ID: <code className="font-mono">ai-studio-1791f9ed-f999-4a0b-a411-b32893a64c15</code></span>
              </div>
              <div className="text-[11px] text-slate-500">
                {lastVerifiedAt ? (
                  <span className="text-emerald-700 font-bold">
                    ✓ Verified at: {new Date(lastVerifiedAt).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">Not yet verified on this session</span>
                )}
              </div>
            </div>

            {/* Counts Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold">
                    <th className="py-2.5 px-3">Entity Collection</th>
                    <th className="py-2.5 px-3">Benchmark Target</th>
                    <th className="py-2.5 px-3">Full Mode Target</th>
                    <th className="py-2.5 px-3">Client In-Memory</th>
                    <th className="py-2.5 px-3">Actual Firestore Count</th>
                    <th className="py-2.5 px-3">Persistence State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collectionsSummary.map(col => {
                    const serverCount = liveServerCounts?.[col.key];
                    const isVerified = serverCount !== undefined && serverCount > 0;
                    return (
                      <tr key={col.key} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {col.key}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {col.targetBenchmark}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono">
                          {col.targetFull}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                          {col.inMemory.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-purple-900">
                          {serverCount !== undefined ? serverCount.toLocaleString() : (
                            <span className="text-slate-400 font-normal italic">Click query</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
                          {isVerified ? (
                            <Badge variant="success" size="sm">
                              ✓ VERIFIED IN FIRESTORE
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              AWAITING VERIFICATION
                            </Badge>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Validation Report */}
      {activeTab === 'validation' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-700" />
                  12-Point Automated System Integrity Report (Module 12)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Automated validation verifying primary key uniqueness, foreign keys, enums, consent enforcement, territory boundaries, and lifecycle states
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">
                  Validation Score: <strong className="text-slate-900 text-sm">{validationReport.score}%</strong>
                </span>
                <Badge
                  variant={
                    validationReport.overallStatus === 'PASSED'
                      ? 'success'
                      : validationReport.overallStatus === 'WARNING'
                      ? 'warning'
                      : 'danger'
                  }
                  size="md"
                >
                  {validationReport.overallStatus}
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 text-xs">
              {validationReport.checks.map(check => (
                <div
                  key={check.id}
                  className={`p-3.5 rounded-lg border ${
                    check.status === 'PASSED'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : check.status === 'WARNING'
                      ? 'bg-amber-50/50 border-amber-200'
                      : 'bg-rose-50/50 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-500 px-1.5 py-0.5 bg-white rounded border border-slate-200">
                        {check.id}
                      </span>
                      <span className="font-bold text-slate-900">{check.name}</span>
                    </div>
                    <Badge
                      variant={check.status === 'PASSED' ? 'success' : check.status === 'WARNING' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {check.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-slate-600 mb-1">{check.message}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Category: {check.category} • Passed: {check.passedCount} • Failed: {check.failedCount}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Exports */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Universal Full Exports */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Database Full Exports</h2>
            <p className="text-xs text-slate-500">
              Export entire CRM data state across relational DDL, full JSON dumps, and isolated benchmark ground truth
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <button
                onClick={handleExport20kSynthetic}
                disabled={isExporting20k}
                className="p-4 rounded-xl border border-purple-200 bg-purple-50/60 hover:bg-purple-100/70 transition-colors text-left flex items-start justify-between cursor-pointer"
              >
                <div>
                  <Sparkles className="w-5 h-5 text-purple-700 mb-2" />
                  <div className="font-bold text-purple-950 text-xs">Export Full 20k Dataset (JSON)</div>
                  <div className="text-[11px] text-purple-800 mt-0.5">
                    {isExporting20k ? 'Generating 20k JSON...' : 'Mulberry32 PRNG Full 20k records'}
                  </div>
                </div>
                <Download className="w-4 h-4 text-purple-600" />
              </button>

              <button
                onClick={handleExportAllJSON}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left flex items-start justify-between cursor-pointer"
              >
                <div>
                  <FileCode className="w-5 h-5 text-purple-700 mb-2" />
                  <div className="font-bold text-slate-900 text-xs">Current CRM JSON Dump</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    All 11 entities currently in memory
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={handleExportSQL}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left flex items-start justify-between cursor-pointer"
              >
                <div>
                  <HardDrive className="w-5 h-5 text-blue-700 mb-2" />
                  <div className="font-bold text-slate-900 text-xs">PostgreSQL / Cloud SQL DDL</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Complete SQL schema with table constraints & indices
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportGroundTruthCSV(groundTruth)}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left flex items-start justify-between cursor-pointer"
              >
                <div>
                  <ShieldCheck className="w-5 h-5 text-emerald-700 mb-2" />
                  <div className="font-bold text-slate-900 text-xs">ground_truth.csv</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Separated benchmark test scenarios for evaluation
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Entity CSV Exports Grid */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Individual Entity CSV Exports</h2>
            <p className="text-xs text-slate-500">
              Download clean CSV files for each of the 11 core CRM entities
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <button
                onClick={() => exportEntityAsCSV('Companies', companies)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Companies.csv</div>
                  <div className="text-[11px] text-slate-400">{companies.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('Contacts', contacts)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Contacts.csv</div>
                  <div className="text-[11px] text-slate-400">{contacts.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('Leads', leads)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Leads.csv</div>
                  <div className="text-[11px] text-slate-400">{leads.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('Campaigns', campaigns)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Campaigns.csv</div>
                  <div className="text-[11px] text-slate-400">{campaigns.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('Activities', activities)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Activities.csv</div>
                  <div className="text-[11px] text-slate-400">{activities.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('Consents', consents)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Consents.csv</div>
                  <div className="text-[11px] text-slate-400">{consents.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('Tasks', tasks)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Tasks.csv</div>
                  <div className="text-[11px] text-slate-400">{tasks.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('Opportunities', opportunities)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Opportunities.csv</div>
                  <div className="text-[11px] text-slate-400">{opportunities.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('StageHistories', stageHistories)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">StageHistories.csv</div>
                  <div className="text-[11px] text-slate-400">{stageHistories.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('SalesReps', salesReps)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">SalesReps.csv</div>
                  <div className="text-[11px] text-slate-400">{salesReps.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('ScoreRules', scoreRules)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">ScoreRules.csv</div>
                  <div className="text-[11px] text-slate-400">{scoreRules.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => exportEntityAsCSV('Anomalies', anomalies)}
                className="p-3 rounded-lg border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left cursor-pointer"
              >
                <div>
                  <div className="font-bold text-slate-900">Anomalies.csv</div>
                  <div className="text-[11px] text-slate-400">{anomalies.length} records</div>
                </div>
                <Download className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Data Dictionary */}
      {activeTab === 'dictionary' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900">Core CRM Entity Data Dictionary</h2>
          <p className="text-xs text-slate-500">
            Formal schema definition for the 11 core entities, primary key formats, cardinality, and validation constraints
          </p>

          <div className="space-y-4 pt-2 text-xs">
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">1. Company</span> • ID: <code className="font-mono font-bold">CO-000001</code>
              <p className="text-slate-600 mt-1">Enterprise account representing client organizations. Contains size, industry, revenue, and territory boundaries.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">2. Contact</span> • ID: <code className="font-mono font-bold">CON-000001</code>
              <p className="text-slate-600 mt-1">Key business persona linked to a company. Enforces normalized email deduplication index and job role seniority.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">3. Campaign</span> • ID: <code className="font-mono font-bold">CMP-000001</code>
              <p className="text-slate-600 mt-1">Demand generation master program (Webinar, Outbound, Paid Search). Tracks lead generation and conversion ROI.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">4. SalesRep</span> • ID: <code className="font-mono font-bold">REP-001</code>
              <p className="text-slate-600 mt-1">Account executives with assigned territory authorization, product specializations, active capacity limits, and quotas.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">5. Lead</span> • ID: <code className="font-mono font-bold">LEAD-2026-000001</code>
              <p className="text-slate-600 mt-1">Central prospect record. Evaluated by Fit (30), Intent (40), Engagement (30) with HOT, WARM, COLD tiers and consent status.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">6. Activity</span> • ID: <code className="font-mono font-bold">ACT-LEAD-2026-000001-001</code>
              <p className="text-slate-600 mt-1">Chronological touchpoint event. Includes temporal leakage guard (isPostConversion) to avoid backward contamination.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">7. Consent</span> • ID: <code className="font-mono font-bold">CS-LEAD-2026-000001-001</code>
              <p className="text-slate-600 mt-1">Regulatory compliance audit log. Enforces explicit consent verification prior to any automated marketing or sales task.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">8. ScoreRule</span> • ID: <code className="font-mono font-bold">RULE-001</code>
              <p className="text-slate-600 mt-1">Effective-dated scoring logic rule. Dictates max points and evaluation criteria across Fit, Intent, and Engagement.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">9. Task</span> • ID: <code className="font-mono font-bold">TASK-LEAD-2026-000001-001</code>
              <p className="text-slate-600 mt-1">Automated sales SLA task. HOT: 1-day SLA, WARM: 3-day SLA, COLD: Nurture. Enforces idempotency checks.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">10. Opportunity</span> • ID: <code className="font-mono font-bold">OPP-2026-000001</code>
              <p className="text-slate-600 mt-1">Qualified sales deal. Enforces single active deal per lead and mandatory documented won/lost reasons.</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50">
              <span className="font-mono font-bold text-purple-700">11. StageHistory</span> • ID: <code className="font-mono font-bold">STG-OPP-2026-000001-001</code>
              <p className="text-slate-600 mt-1">Immutable audit log for each opportunity stage progression. Tracks duration in prior stage, authorizer, and transition reason.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Synthetic Source Manifest */}
      {activeTab === 'manifest' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-slate-900">Synthetic Source Manifest</h2>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono space-y-2 text-slate-800">
            <div><strong>PLATFORM:</strong> {SYNTHETIC_SOURCE_MANIFEST.platform}</div>
            <div><strong>ENVIRONMENT:</strong> {SYNTHETIC_SOURCE_MANIFEST.environment}</div>
            <div><strong>VERSION:</strong> {SYNTHETIC_SOURCE_MANIFEST.datasetVersion}</div>
            <div><strong>DETERMINISTIC SEED:</strong> {SYNTHETIC_SOURCE_MANIFEST.fixedSeed}</div>
            <div><strong>ENTITIES COUNT:</strong> {SYNTHETIC_SOURCE_MANIFEST.primaryEntitiesCount}</div>
            <div className="pt-2 border-t border-slate-200 text-slate-600 leading-relaxed font-sans">
              <strong>LEGAL NOTICE:</strong> {SYNTHETIC_SOURCE_MANIFEST.legalNotice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
