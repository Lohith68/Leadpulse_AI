import React, { useState } from 'react';
import {
  Settings,
  Shield,
  UserCheck,
  Database,
  Lock,
  Key,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { UserRole } from '../../types/crm';
import { Badge } from '../common/Badge';
import { testConnection } from '../../firebase/config';

export const SettingsView: React.FC = () => {
  const { currentRole, setCurrentRole, dbConnected } = useCRM();

  const [testResult, setTestResult] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const res = await testConnection();
      setTestResult(res.message);
    } finally {
      setIsTesting(false);
    }
  };

  const roles: UserRole[] = [
    'Admin',
    'Sales Manager',
    'Sales Representative',
    'Marketing',
    'Analyst',
  ];

  const permissionsMatrix = [
    { feature: 'View Dashboard & Analytics', Admin: true, 'Sales Manager': true, 'Sales Representative': true, Marketing: true, Analyst: true },
    { feature: 'Score Leads & Inspect Breakdown', Admin: true, 'Sales Manager': true, 'Sales Representative': true, Marketing: true, Analyst: true },
    { feature: 'Advance Opportunity Stages', Admin: true, 'Sales Manager': true, 'Sales Representative': true, Marketing: false, Analyst: false },
    { feature: 'Reassign Territory & Sales Reps', Admin: true, 'Sales Manager': true, 'Sales Representative': false, Marketing: false, Analyst: false },
    { feature: 'Override Regulatory Consent', Admin: true, 'Sales Manager': false, 'Sales Representative': false, Marketing: false, Analyst: false },
    { feature: 'Execute Batch Firestore Seed', Admin: true, 'Sales Manager': false, 'Sales Representative': false, Marketing: false, Analyst: false },
    { feature: 'Export Full CSV & SQL Schemas', Admin: true, 'Sales Manager': true, 'Sales Representative': false, Marketing: true, Analyst: true },
    { feature: 'Trigger System Integrity Audit', Admin: true, 'Sales Manager': true, 'Sales Representative': false, Marketing: false, Analyst: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Settings & Security Governance
            </h1>
            <Badge variant="purple" size="md">
              Active Simulator: {currentRole}
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Role-based access control (RBAC), security rule verification, API proxies, and connectivity health.
          </p>
        </div>
      </div>

      {/* RBAC Role Switcher Card */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#2563EB]" />
          <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">Active Role Simulation (RBAC)</h2>
        </div>
        <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
          Switch user session persona to evaluate role-governed actions across sales reps, managers, marketing, and data analysts.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setCurrentRole(r)}
              className={`p-3 rounded-xl border text-center transition-all text-xs font-semibold cursor-pointer ${
                currentRole === r
                  ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                  : 'bg-[#F8FAFC] dark:bg-[#0B1220] border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] hover:border-[#2563EB]/50'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220]">
          <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Role-Based Access Control (RBAC) Matrix</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase border-b border-[#E2E8F0] dark:border-[#263449]">
                <th className="py-3 px-4">Feature / Operation</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Sales Manager</th>
                <th className="py-3 px-4 text-center">Sales Rep</th>
                <th className="py-3 px-4 text-center">Marketing</th>
                <th className="py-3 px-4 text-center">Analyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70 text-[#0F172A] dark:text-[#F8FAFC]">
              {permissionsMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                  <td className="py-3 px-4 font-semibold">{row.feature}</td>
                  <td className="py-3 px-4 text-center">
                    {row.Admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                    ) : (
                      <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row['Sales Manager'] ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                    ) : (
                      <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row['Sales Representative'] ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                    ) : (
                      <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.Marketing ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                    ) : (
                      <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {row.Analyst ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 inline" />
                    ) : (
                      <span className="text-[#64748B] dark:text-[#94A3B8]">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cloud Firestore & Security Invariants */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-[#2563EB]" />
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Cloud Firestore Infrastructure</h2>
          </div>
          <div className="text-xs space-y-2 text-[#64748B] dark:text-[#94A3B8]">
            <div>
              <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Database Engine:</span> Cloud Firestore (Native Enterprise)
            </div>
            <div>
              <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Status:</span>{' '}
              <Badge variant={dbConnected ? 'success' : 'warning'}>
                {dbConnected ? 'Online & Synchronized' : 'Connecting'}
              </Badge>
            </div>
            <div>
              <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">Security Rules:</span> Hardened ABAC Deployed
            </div>
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#263449] flex items-center gap-3">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3.5 py-2 rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] hover:bg-slate-100 dark:hover:bg-slate-800 text-[#0F172A] dark:text-[#F8FAFC] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#2563EB]' : ''}`} />
              Test Connection Health
            </button>
            {testResult && <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">{testResult}</span>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-[#14B8A6]" />
            <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Gemini AI Server Proxy Architecture</h2>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            API keys for Gemini models are held securely on the server-side Node runtime. Client requests route through the authenticated internal endpoint <code className="font-mono text-xs bg-[#F8FAFC] dark:bg-[#0B1220] px-1.5 py-0.5 rounded-md border border-[#E2E8F0] dark:border-[#263449] text-[#2563EB] dark:text-[#3B82F6]">/api/ai/*</code>, preventing browser API key exposure.
          </p>
          <div className="pt-3 border-t border-[#E2E8F0] dark:border-[#263449] flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Zero Frontend Secrets Exposure
          </div>
        </div>
      </div>
    </div>
  );
};
