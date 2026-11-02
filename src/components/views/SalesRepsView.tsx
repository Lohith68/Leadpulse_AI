import React, { useMemo } from 'react';
import { UserCheck, Mail, MapPin, Award, CheckCircle2, AlertCircle, Briefcase } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { SalesRep } from '../../types/crm';
import { Badge } from '../common/Badge';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';

export const SalesRepsView: React.FC = () => {
  const { salesReps, leads, opportunities } = useCRM();

  const handleToggleStatus = async (rep: SalesRep) => {
    const nextStatus = rep.status === 'AVAILABLE' ? 'BUSY' : 'AVAILABLE';
    await updateDoc(doc(db, 'salesReps', rep.id), {
      status: nextStatus,
      updatedAt: new Date().toISOString(),
    });
  };

  const metrics = useMemo(() => {
    let available = 0;
    let totalQuota = 0;
    let totalWon = 0;

    salesReps.forEach(r => {
      if (r.status === 'AVAILABLE') available++;
      totalQuota += r.quota || 0;
      totalWon += r.pipelineWon || 0;
    });

    return {
      total: salesReps.length,
      available,
      totalQuota,
      totalWon,
      avgAttainment: totalQuota > 0 ? Math.round((totalWon / totalQuota) * 100) : 0,
    };
  }, [salesReps]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Sales Representatives &amp; Coverage
            </h1>
            <Badge variant="teal" size="md">
              {salesReps.length} Active Reps
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Territory authorization boundaries, product specializations, active lead capacities, and quota tracking.
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Sales Force</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{metrics.total} Reps</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">{metrics.available} Available for Routing</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Active Capacity</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{metrics.available} Available</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Live Lead Ingestion Ready</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Team Quota Target</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">
            ${(metrics.totalQuota / 1000000).toFixed(1)}M
          </div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Annual Revenue Goal</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Team Attainment</div>
          <div className="text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6] mt-1 tabular-nums">
            {metrics.avgAttainment}%
          </div>
          <div className="text-[11px] text-[#14B8A6] font-medium mt-1">${(metrics.totalWon / 1000).toFixed(0)}k Closed Won</div>
        </div>
      </div>

      {/* Rep Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {salesReps.map(rep => {
          const quotaPercent = rep.quota > 0 ? Math.min(100, Math.round((rep.pipelineWon / rep.quota) * 100)) : 0;
          const capacityPercent = rep.capacityLimit > 0 ? Math.round((rep.activeLeadsCount / rep.capacityLimit) * 100) : 0;

          return (
            <div
              key={rep.id}
              className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-[#2563EB]/40 transition-all"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-[#64748B] dark:text-[#94A3B8]">{rep.id}</span>
                  <Badge variant={rep.status === 'AVAILABLE' ? 'success' : 'warning'}>
                    {rep.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">{rep.name}</h3>
                <div className="text-xs text-[#64748B] dark:text-[#94A3B8] flex items-center gap-1.5 mt-1 font-mono">
                  <Mail className="w-3.5 h-3.5 text-[#2563EB]" /> {rep.email}
                </div>
              </div>

              {/* Specialization & Territory */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
                <div>
                  <span className="text-[#64748B] dark:text-[#94A3B8] block font-medium">Territory Boundary:</span>
                  <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{rep.territory}</span>
                </div>
                <div>
                  <span className="text-[#64748B] dark:text-[#94A3B8] block font-medium">Specialization:</span>
                  <span className="font-semibold text-[#2563EB] dark:text-[#3B82F6]">{rep.specialization}</span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  <span>Capacity Utilization:</span>
                  <span className="tabular-nums">
                    {rep.activeLeadsCount} / {rep.capacityLimit} Leads ({capacityPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      capacityPercent > 85 ? 'bg-rose-500' : 'bg-[#2563EB]'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Quota Progress */}
              <div className="space-y-1.5 pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
                <div className="flex justify-between text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  <span>Annual Quota Attainment:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">{quotaPercent}%</span>
                </div>
                <div className="flex justify-between text-[11px] text-[#64748B] dark:text-[#94A3B8] tabular-nums">
                  <span>Won: ${(rep.pipelineWon / 1000).toFixed(0)}k</span>
                  <span>Target: ${(rep.quota / 1000).toFixed(0)}k</span>
                </div>
              </div>

              {/* Status Toggle */}
              <button
                onClick={() => handleToggleStatus(rep)}
                className="w-full py-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] bg-[#F8FAFC] dark:bg-[#0B1220] hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] transition-colors cursor-pointer"
              >
                Toggle Status ({rep.status === 'AVAILABLE' ? 'Mark Busy' : 'Mark Available'})
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
