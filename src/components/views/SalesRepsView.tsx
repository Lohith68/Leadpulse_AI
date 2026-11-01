import React, { useState } from 'react';
import { UserCheck, Mail, MapPin, Award, CheckCircle2, AlertCircle } from 'lucide-react';
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Sales Representatives & Coverage
            </h1>
            <Badge variant="purple" size="md">
              {salesReps.length} Active Reps
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Territory authorization boundaries, product specializations, active capacity, and quotas
          </p>
        </div>
      </div>

      {/* Rep Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {salesReps.map(rep => {
          const repLeads = leads.filter(l => l.assignedRepId === rep.id);
          const repOpps = opportunities.filter(o => o.assignedRepId === rep.id);
          const quotaPercent = rep.quota > 0 ? Math.min(100, Math.round((rep.pipelineWon / rep.quota) * 100)) : 0;
          const capacityPercent = rep.capacityLimit > 0 ? Math.round((rep.activeLeadsCount / rep.capacityLimit) * 100) : 0;

          return (
            <div
              key={rep.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-bold text-slate-400">{rep.id}</span>
                  <Badge variant={rep.status === 'AVAILABLE' ? 'success' : 'warning'}>
                    {rep.status}
                  </Badge>
                </div>
                <h3 className="text-lg font-extrabold text-slate-900">{rep.name}</h3>
                <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {rep.email}
                </div>
              </div>

              {/* Specialization & Territory */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-3 border-t border-slate-100">
                <div>
                  <span className="text-slate-400 block font-medium">Territory Boundary:</span>
                  <span className="font-bold text-slate-800">{rep.territory}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-medium">Specialization:</span>
                  <span className="font-bold text-purple-700">{rep.specialization}</span>
                </div>
              </div>

              {/* Capacity Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Capacity Utilization:</span>
                  <span>
                    {rep.activeLeadsCount} / {rep.capacityLimit} Leads ({capacityPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      capacityPercent > 85 ? 'bg-rose-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${capacityPercent}%` }}
                  />
                </div>
              </div>

              {/* Quota Progress */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between text-xs font-semibold text-slate-600">
                  <span>Annual Quota Attainment:</span>
                  <span className="text-emerald-700 font-bold">{quotaPercent}%</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Won: ${(rep.pipelineWon / 1000).toFixed(0)}k</span>
                  <span>Target: ${(rep.quota / 1000).toFixed(0)}k</span>
                </div>
              </div>

              {/* Status Toggle */}
              <button
                onClick={() => handleToggleStatus(rep)}
                className="w-full py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
              >
                Toggle Availability ({rep.status === 'AVAILABLE' ? 'Mark Busy' : 'Mark Available'})
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
