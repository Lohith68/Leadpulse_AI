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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Settings & Security Governance
            </h1>
            <Badge variant="purple" size="md">
              Role: {currentRole}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-based access control (RBAC), security rule verification, API proxies, and connectivity health
          </p>
        </div>
      </div>

      {/* RBAC Role Switcher Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-purple-700" />
          <h2 className="text-base font-bold text-slate-900">Active Role Simulation (RBAC)</h2>
        </div>
        <p className="text-xs text-slate-500">
          Switch user session persona to evaluate role-governed actions across sales reps, managers, and analysts
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
          {roles.map(r => (
            <button
              key={r}
              onClick={() => setCurrentRole(r)}
              className={`p-3 rounded-xl border text-center transition-all text-xs font-bold ${
                currentRole === r
                  ? 'bg-purple-700 text-white border-purple-700 shadow-sm'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Permissions Matrix */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50">
          <h2 className="text-sm font-bold text-slate-900">Role-Based Access Control (RBAC) Matrix</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-2.5 px-4">Feature / Operation</th>
                <th className="py-2.5 px-4 text-center">Admin</th>
                <th className="py-2.5 px-4 text-center">Sales Manager</th>
                <th className="py-2.5 px-4 text-center">Sales Rep</th>
                <th className="py-2.5 px-4 text-center">Marketing</th>
                <th className="py-2.5 px-4 text-center">Analyst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {permissionsMatrix.map((row, i) => (
                <tr key={i} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{row.feature}</td>
                  <td className="py-2.5 px-4 text-center">
                    {row.Admin ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row['Sales Manager'] ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row['Sales Representative'] ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.Marketing ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.Analyst ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 inline" />
                    ) : (
                      <span className="text-slate-300">-</span>
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
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-slate-900">Cloud Firestore Infrastructure</h2>
          </div>
          <div className="text-xs space-y-1.5 text-slate-600">
            <div>
              <span className="font-semibold text-slate-400">Database Engine:</span> Cloud Firestore (Native Enterprise)
            </div>
            <div>
              <span className="font-semibold text-slate-400">Status:</span>{' '}
              <Badge variant={dbConnected ? 'success' : 'warning'}>
                {dbConnected ? 'Online & Synchronized' : 'Connecting'}
              </Badge>
            </div>
            <div>
              <span className="font-semibold text-slate-400">Security Rules:</span> Hardened ABAC Deployed
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
              Test Connection Health
            </button>
            {testResult && <span className="text-xs text-emerald-700 font-semibold">{testResult}</span>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-purple-700" />
            <h2 className="text-sm font-bold text-slate-900">Gemini AI Server Proxy Architecture</h2>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            API keys for Gemini models (<code className="font-mono text-purple-700 font-bold">gemini-3.8-flash</code>) are held securely on the server-side Node runtime. Client requests route through the authenticated internal endpoint <code className="font-mono text-xs bg-slate-100 px-1 py-0.5 rounded">/api/ai/*</code>, preventing browser API key exposure.
          </p>
          <div className="pt-2 border-t border-slate-100 flex items-center gap-2 text-xs text-emerald-700 font-semibold">
            <CheckCircle2 className="w-4 h-4" /> Zero Frontend Secrets Exposure
          </div>
        </div>
      </div>
    </div>
  );
};
