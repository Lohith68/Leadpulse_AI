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
import { useAuth } from '../../context/AuthContext';
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
  const { can, activeRole } = useAuth();

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Data Management &amp; Governance
            </h1>
            <Badge variant="teal" size="md">
              Fixed SEED = 20261022
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Synthetic dataset generator supporting Benchmark (200) &amp; Full (20,000) modes, controlled batch seeding, and independent Firestore verification.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center flex-wrap gap-1 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] p-1 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'generator' ? 'bg-[#2563EB] text-white shadow-xs font-bold' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Generator &amp; Seeder
          </button>
          <button
            onClick={() => setActiveTab('server-verify')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'server-verify' ? 'bg-[#2563EB] text-white shadow-xs font-bold' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Live Verification
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'validation' ? 'bg-[#2563EB] text-white shadow-xs font-bold' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Validation
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'export' ? 'bg-[#2563EB] text-white shadow-xs font-bold' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Exports
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'dictionary' ? 'bg-[#2563EB] text-white shadow-xs font-bold' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Dictionary
          </button>
          <button
            onClick={() => setActiveTab('manifest')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'manifest' ? 'bg-[#2563EB] text-white shadow-xs font-bold' : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white'
            }`}
          >
            Manifest
          </button>
        </div>
      </div>

      {/* Tab 1: Synthetic Data Generator */}
      {activeTab === 'generator' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#2563EB]" />
                  Deterministic Synthetic Generation Engine (Mulberry32 PRNG)
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Parent records generated before child records with 100% valid foreign keys, labelled duplicates, opted-out leads, and all 5 mandatory anomaly scenarios.
                </p>
              </div>
              <span className="font-mono text-xs font-bold px-3 py-1 bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] rounded-lg border border-[#E2E8F0] dark:border-[#263449] self-start">
                SEED: 20261022
              </span>
            </div>

            <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] space-y-5 text-xs">
              <div>
                <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-2">
                  Select Seeding Mode:
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BENCHMARK MODE */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('BENCHMARK')}
                    className={`p-5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      selectedMode === 'BENCHMARK'
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-[#2563EB] shadow-xs ring-2 ring-[#2563EB]/20'
                        : 'bg-white dark:bg-[#111C2E] border-[#E2E8F0] dark:border-[#263449] hover:border-[#2563EB]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">BENCHMARK MODE</span>
                      <Badge variant="teal" size="sm">Quick Testing</Badge>
                    </div>
                    <div className="font-mono text-xs text-[#2563EB] dark:text-[#3B82F6] font-bold mb-1">
                      200 Leads • 100 Contacts • 50 Companies • 60 Opportunities
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      Instant verification dataset for automated unit tests, fast schema validation, and immediate interactive exploration.
                    </p>
                  </button>

                  {/* FULL MODE */}
                  <button
                    type="button"
                    onClick={() => setSelectedMode('FULL')}
                    className={`p-5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                      selectedMode === 'FULL'
                        ? 'bg-blue-50/70 dark:bg-blue-950/40 border-[#2563EB] shadow-xs ring-2 ring-[#2563EB]/20'
                        : 'bg-white dark:bg-[#111C2E] border-[#E2E8F0] dark:border-[#263449] hover:border-[#2563EB]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-[#0F172A] dark:text-[#F8FAFC]">FULL MODE</span>
                      <Badge variant="success" size="sm">Full Problem Statement</Badge>
                    </div>
                    <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                      20,000 Leads • 10,000 Contacts • 5,000 Companies • 3,000 Opportunities
                    </div>
                    <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
                      Complete enterprise scale with all 11 entities, ~40,000 activities, ~16,000 SLA tasks, stage histories, duplicate labels, and isolated ground truth.
                    </p>
                  </button>
                </div>
              </div>

              {/* Progress & Batch Controls during Seeding */}
              {isSeeding && seedingProgress && (
                <div className="p-4 bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-xs flex items-center gap-2">
                      <RotateCw className="w-4 h-4 text-[#2563EB] animate-spin" />
                      <span>{seedingProgress.message}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] text-sm tabular-nums">
                        {seedingProgress.percentage}%
                      </span>
                      {seedingProgress.totalBatches > 0 && (
                        <span className="text-[11px] font-semibold text-[#2563EB] dark:text-[#3B82F6] bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded-md">
                          Batch {seedingProgress.batchIndex} / {seedingProgress.totalBatches}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-blue-200/70 dark:bg-blue-950 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-[#2563EB] h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, seedingProgress.percentage)}%` }}
                    />
                  </div>

                  {/* Operational Controls: Pause / Resume / Cancel */}
                  <div className="flex items-center justify-between pt-1 text-[11px]">
                    <span className="text-[#64748B] dark:text-[#94A3B8]">
                      Phase: <strong className="uppercase text-[#0F172A] dark:text-[#F8FAFC]">{seedingProgress.phase}</strong> ({seedingProgress.current.toLocaleString()} / {seedingProgress.total.toLocaleString()} records)
                    </span>
                    <div className="flex items-center gap-2">
                      {isPaused ? (
                        <button
                          type="button"
                          onClick={resumeSeeding}
                          className="px-3 py-1 rounded-lg bg-[#2563EB] text-white font-bold hover:bg-[#1D4ED8] flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="w-3 h-3" /> Resume
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={pauseSeeding}
                          className="px-3 py-1 rounded-lg bg-amber-600 text-white font-bold hover:bg-amber-700 flex items-center gap-1 cursor-pointer"
                        >
                          <Pause className="w-3 h-3" /> Pause
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={cancelSeeding}
                        className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-bold hover:bg-red-200 flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3 h-3" /> Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Seeding Action Bar */}
              <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E2E8F0] dark:border-[#263449]">
                <span className="text-[#64748B] dark:text-[#94A3B8] text-[11px]">
                  Batch writes safe chunking (&le; 300 docs/batch) with exponential backoff retries and idempotent merge keys.
                </span>
                <div className="flex items-center gap-3">
                  {can('create', 'data_management') ? (
                    <button
                      onClick={handleTriggerSeed}
                      disabled={isSeeding}
                      className="px-6 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      {isSeeding
                        ? isPaused
                          ? 'Seeding Paused...'
                          : 'Writing to Cloud Firestore...'
                        : `Seed ${selectedMode} (${selectedMode === 'BENCHMARK' ? '200' : '20,000'} Leads) into Firestore`}
                    </button>
                  ) : (
                    <div className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-[#94A3B8] font-semibold text-xs border border-[#E2E8F0] dark:border-[#263449]">
                      Admin Clearance Required to Execute Data Generation
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Server Counts Summary Strip */}
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Cloud Firestore Persistence Status
                </div>
                <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
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
              className="px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0F172A] dark:text-[#F8FAFC] font-semibold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#2563EB] ${isVerifyingServer ? 'animate-spin' : ''}`} />
              {isVerifyingServer ? 'Querying Firestore Server...' : 'Verify Counts in Cloud Firestore'}
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Independent Live Server Verification Panel */}
      {activeTab === 'server-verify' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <Server className="w-5 h-5 text-emerald-600" />
                  Independent Cloud Firestore Server Verification
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Queries actual persisted documents in Cloud Firestore via <code className="font-mono bg-[#F8FAFC] dark:bg-[#0B1220] px-1.5 py-0.5 rounded border border-[#E2E8F0] dark:border-[#263449]">getCountFromServer</code> to confirm real storage.
                </p>
              </div>

              <button
                onClick={() => verifyLiveCounts()}
                disabled={isVerifyingServer}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isVerifyingServer ? 'animate-spin' : ''}`} />
                {isVerifyingServer ? 'Querying Cloud Firestore Server...' : 'Query Live Server Counts Now'}
              </button>
            </div>

            {/* Verification Status Header */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Verification Source:</span>
                <Badge variant="success" size="md">
                  Server-side Aggregation API
                </Badge>
                <span className="text-[#64748B] dark:text-[#94A3B8]">•</span>
                <span className="text-[#64748B] dark:text-[#94A3B8]">Database: <code className="font-mono">ai-studio-1791f9ed-f999-4a0b-a411-b32893a64c15</code></span>
              </div>
              <div className="text-[11px]">
                {lastVerifiedAt ? (
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                    ✓ Verified at: {new Date(lastVerifiedAt).toLocaleString()}
                  </span>
                ) : (
                  <span className="text-amber-600 font-semibold">Not yet verified on this session</span>
                )}
              </div>
            </div>

            {/* Counts Grid */}
            <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#263449] rounded-xl">
              <table className="w-full text-left border-collapse text-xs text-[#0F172A] dark:text-[#F8FAFC]">
                <thead>
                  <tr className="border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase">
                    <th className="py-3 px-4">Entity Collection</th>
                    <th className="py-3 px-4">Benchmark Target</th>
                    <th className="py-3 px-4">Full Mode Target</th>
                    <th className="py-3 px-4">Client In-Memory</th>
                    <th className="py-3 px-4">Actual Firestore Count</th>
                    <th className="py-3 px-4">Persistence State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70">
                  {collectionsSummary.map(col => {
                    const serverCount = liveServerCounts?.[col.key];
                    const isVerified = serverCount !== undefined && serverCount > 0;
                    return (
                      <tr key={col.key} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold">
                          {col.key}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8] font-mono tabular-nums">
                          {col.targetBenchmark}
                        </td>
                        <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8] font-mono tabular-nums">
                          {col.targetFull}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold tabular-nums">
                          {col.inMemory.toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-[#2563EB] dark:text-[#3B82F6] tabular-nums">
                          {serverCount !== undefined ? serverCount.toLocaleString() : (
                            <span className="text-[#64748B] dark:text-[#94A3B8] font-normal italic">Click query</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isVerified ? (
                            <Badge variant="success" size="sm">
                              ✓ VERIFIED IN FIRESTORE
                            </Badge>
                          ) : (
                            <Badge variant="warning" size="sm">
                              AWAITING QUERY
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
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#2563EB]" />
                  12-Point Automated System Integrity Report
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1">
                  Automated validation verifying primary key uniqueness, foreign keys, enums, consent enforcement, territory boundaries, and lifecycle states.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Validation Score: <strong className="text-[#0F172A] dark:text-[#F8FAFC] text-sm tabular-nums">{validationReport.score}%</strong>
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
                  className={`p-4 rounded-xl border ${
                    check.status === 'PASSED'
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
                      : check.status === 'WARNING'
                      ? 'bg-amber-50/20 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                      : 'bg-rose-50/20 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-[#64748B] dark:text-[#94A3B8] px-2 py-0.5 bg-white dark:bg-[#111C2E] rounded border border-[#E2E8F0] dark:border-[#263449]">
                        {check.id}
                      </span>
                      <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{check.name}</span>
                    </div>
                    <Badge
                      variant={check.status === 'PASSED' ? 'success' : check.status === 'WARNING' ? 'warning' : 'danger'}
                      size="sm"
                    >
                      {check.status}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mb-1">{check.message}</div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono tabular-nums">
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
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">Database Full Exports</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Export entire CRM data state across relational DDL, full JSON dumps, and isolated benchmark ground truth.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <button
                onClick={handleExport20kSynthetic}
                disabled={isExporting20k}
                className="p-5 rounded-2xl border border-[#2563EB]/40 bg-blue-50/60 dark:bg-blue-950/30 hover:bg-blue-100/70 transition-colors text-left flex items-start justify-between cursor-pointer"
              >
                <div>
                  <Sparkles className="w-5 h-5 text-[#2563EB] mb-2" />
                  <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-xs">Export Full 20k Dataset (JSON)</div>
                  <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] mt-1 font-medium">
                    {isExporting20k ? 'Generating 20k JSON...' : 'Mulberry32 PRNG Full 20k records'}
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#2563EB]" />
              </button>

              <button
                onClick={handleExportAllJSON}
                className="p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left flex items-start justify-between cursor-pointer"
              >
                <div>
                  <FileCode className="w-5 h-5 text-[#2563EB] mb-2" />
                  <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-xs">Current CRM JSON Dump</div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                    All 11 entities currently in memory
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
              </button>

              <button
                onClick={handleExportSQL}
                className="p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left flex items-start justify-between cursor-pointer"
              >
                <div>
                  <HardDrive className="w-5 h-5 text-[#14B8A6] mb-2" />
                  <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-xs">PostgreSQL / Cloud SQL DDL</div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                    Complete SQL schema with table constraints &amp; indices
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
              </button>

              <button
                onClick={() => exportGroundTruthCSV(groundTruth)}
                className="p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left flex items-start justify-between cursor-pointer"
              >
                <div>
                  <ShieldCheck className="w-5 h-5 text-emerald-600 mb-2" />
                  <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] text-xs">ground_truth.csv</div>
                  <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
                    Separated benchmark test scenarios for evaluation
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8]" />
              </button>
            </div>
          </div>

          {/* Entity CSV Exports Grid */}
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">Individual Entity CSV Exports</h2>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
              Download clean CSV files for each of the 11 core CRM entities.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { name: 'Companies.csv', count: companies.length, fn: () => exportEntityAsCSV('Companies', companies) },
                { name: 'Contacts.csv', count: contacts.length, fn: () => exportEntityAsCSV('Contacts', contacts) },
                { name: 'Leads.csv', count: leads.length, fn: () => exportEntityAsCSV('Leads', leads) },
                { name: 'Campaigns.csv', count: campaigns.length, fn: () => exportEntityAsCSV('Campaigns', campaigns) },
                { name: 'Activities.csv', count: activities.length, fn: () => exportEntityAsCSV('Activities', activities) },
                { name: 'Consents.csv', count: consents.length, fn: () => exportEntityAsCSV('Consents', consents) },
                { name: 'Tasks.csv', count: tasks.length, fn: () => exportEntityAsCSV('Tasks', tasks) },
                { name: 'Opportunities.csv', count: opportunities.length, fn: () => exportEntityAsCSV('Opportunities', opportunities) },
                { name: 'StageHistories.csv', count: stageHistories.length, fn: () => exportEntityAsCSV('StageHistories', stageHistories) },
                { name: 'SalesReps.csv', count: salesReps.length, fn: () => exportEntityAsCSV('SalesReps', salesReps) },
                { name: 'ScoreRules.csv', count: scoreRules.length, fn: () => exportEntityAsCSV('ScoreRules', scoreRules) },
                { name: 'Anomalies.csv', count: anomalies.length, fn: () => exportEntityAsCSV('Anomalies', anomalies) },
              ].map(item => (
                <button
                  key={item.name}
                  onClick={item.fn}
                  className="p-3.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{item.name}</div>
                    <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] tabular-nums">{item.count.toLocaleString()} records</div>
                  </div>
                  <Download className="w-4 h-4 text-[#2563EB]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Data Dictionary */}
      {activeTab === 'dictionary' && (
        <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">Core CRM Entity Data Dictionary</h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
            Formal schema definition for the 11 core entities, primary key formats, cardinality, and validation constraints.
          </p>

          <div className="space-y-3 pt-2 text-xs">
            {[
              { id: '1. Company', code: 'CO-000001', desc: 'Enterprise account representing client organizations. Contains size, industry, revenue, and territory boundaries.' },
              { id: '2. Contact', code: 'CON-000001', desc: 'Key business persona linked to a company. Enforces normalized email deduplication index and job role seniority.' },
              { id: '3. Campaign', code: 'CMP-000001', desc: 'Demand generation master program (Webinar, Outbound, Paid Search). Tracks lead generation and conversion ROI.' },
              { id: '4. SalesRep', code: 'REP-001', desc: 'Account executives with assigned territory authorization, product specializations, active capacity limits, and quotas.' },
              { id: '5. Lead', code: 'LEAD-2026-000001', desc: 'Central prospect record. Evaluated by Fit (30), Intent (40), Engagement (30) with HOT, WARM, COLD tiers and consent status.' },
              { id: '6. Activity', code: 'ACT-LEAD-2026-000001-001', desc: 'Chronological touchpoint event. Includes temporal leakage guard (isPostConversion) to avoid backward contamination.' },
              { id: '7. Consent', code: 'CS-LEAD-2026-000001-001', desc: 'Regulatory compliance audit log. Enforces explicit consent verification prior to any automated marketing or sales task.' },
              { id: '8. ScoreRule', code: 'RULE-001', desc: 'Effective-dated scoring logic rule. Dictates max points and evaluation criteria across Fit, Intent, and Engagement.' },
              { id: '9. Task', code: 'TASK-LEAD-2026-000001-001', desc: 'Automated sales SLA task. HOT: 1-day SLA, WARM: 3-day SLA, COLD: Nurture. Enforces idempotency checks.' },
              { id: '10. Opportunity', code: 'OPP-2026-000001', desc: 'Qualified sales deal. Enforces single active deal per lead and mandatory documented won/lost reasons.' },
              { id: '11. StageHistory', code: 'STG-OPP-2026-000001-001', desc: 'Immutable audit log for each opportunity stage progression. Tracks duration in prior stage, authorizer, and transition reason.' },
            ].map(entity => (
              <div key={entity.id} className="border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-3.5 bg-[#F8FAFC] dark:bg-[#0B1220]">
                <span className="font-semibold text-[#2563EB] dark:text-[#3B82F6]">{entity.id}</span> • ID: <code className="font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">{entity.code}</code>
                <p className="text-[#64748B] dark:text-[#94A3B8] mt-1">{entity.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 6: Synthetic Source Manifest */}
      {activeTab === 'manifest' && (
        <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">Synthetic Source Manifest</h2>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-xs font-mono space-y-2 text-[#0F172A] dark:text-[#F8FAFC]">
            <div><strong>PLATFORM:</strong> {SYNTHETIC_SOURCE_MANIFEST.platform}</div>
            <div><strong>ENVIRONMENT:</strong> {SYNTHETIC_SOURCE_MANIFEST.environment}</div>
            <div><strong>VERSION:</strong> {SYNTHETIC_SOURCE_MANIFEST.datasetVersion}</div>
            <div><strong>DETERMINISTIC SEED:</strong> {SYNTHETIC_SOURCE_MANIFEST.fixedSeed}</div>
            <div><strong>ENTITIES COUNT:</strong> {SYNTHETIC_SOURCE_MANIFEST.primaryEntitiesCount}</div>
            <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8] leading-relaxed font-sans">
              <strong>LEGAL NOTICE:</strong> {SYNTHETIC_SOURCE_MANIFEST.legalNotice}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
