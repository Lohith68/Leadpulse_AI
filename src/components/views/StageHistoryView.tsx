import React, { useMemo } from 'react';
import { GitCommit, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Badge } from '../common/Badge';

export const StageHistoryView: React.FC = () => {
  const { stageHistories, opportunities } = useCRM();

  const oppsMap = useMemo(() => new Map(opportunities.map(o => [o.id, o])), [opportunities]);

  // Stage Average Duration Analytics
  const avgDurations = useMemo(() => {
    const stageSums: Record<string, { totalDays: number; count: number }> = {
      NEW: { totalDays: 0, count: 0 },
      QUALIFIED: { totalDays: 0, count: 0 },
      PROPOSAL: { totalDays: 0, count: 0 },
      NEGOTIATION: { totalDays: 0, count: 0 },
    };

    stageHistories.forEach(h => {
      if (stageSums[h.fromStage]) {
        stageSums[h.fromStage].totalDays += h.durationDays;
        stageSums[h.fromStage].count++;
      }
    });

    return Object.entries(stageSums).map(([stg, data]) => ({
      stage: stg,
      avgDays: data.count > 0 ? Math.round(data.totalDays / data.count) : 0,
      count: data.count,
    }));
  }, [stageHistories]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Opportunity Stage History Audit Log
            </h1>
            <Badge variant="teal" size="md">
              {stageHistories.length} Transition Logs
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Immutable transition audit records verifying pipeline progression, stage cycle velocity, and authorization.
          </p>
        </div>
      </div>

      {/* Cycle Time Velocity Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {avgDurations.map(stat => (
          <div key={stat.stage} className="bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
            <div className="flex items-center justify-between text-[#64748B] dark:text-[#94A3B8] text-xs font-semibold">
              <span>{stat.stage} Velocity</span>
              <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
            </div>
            <div className="mt-2 text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] font-mono tabular-nums">
              {stat.avgDays} <span className="text-xs font-normal text-[#64748B] dark:text-[#94A3B8]">days avg</span>
            </div>
            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] mt-1">
              Across {stat.count} transition events
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] border-b border-[#E2E8F0] dark:border-[#263449] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Opportunity</th>
                <th className="py-3 px-4">Stage Transition</th>
                <th className="py-3 px-4">Prior Stage Duration</th>
                <th className="py-3 px-4">Transition Rationale</th>
                <th className="py-3 px-4">Authorized By</th>
                <th className="py-3 px-4 text-right">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70 text-[#0F172A] dark:text-[#F8FAFC]">
              {stageHistories.map(history => {
                const opp = oppsMap.get(history.opportunityId);
                return (
                  <tr key={history.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold">{history.id}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold">{opp?.name || history.opportunityId}</div>
                      <span className="font-mono text-[10px] text-[#2563EB] dark:text-[#3B82F6]">{history.opportunityId}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 font-semibold">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">{history.fromStage}</span>
                        <ArrowRight className="w-3 h-3 text-[#64748B] dark:text-[#94A3B8]" />
                        <span className="text-[#2563EB] dark:text-[#3B82F6]">{history.toStage}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold tabular-nums">
                      {history.durationDays} days
                    </td>
                    <td className="py-3.5 px-4 text-[#64748B] dark:text-[#94A3B8] max-w-xs truncate">
                      {history.transitionReason || 'Standard stage advancement.'}
                    </td>
                    <td className="py-3.5 px-4 font-medium">{history.changedBy}</td>
                    <td className="py-3.5 px-4 text-right text-[#64748B] dark:text-[#94A3B8] font-mono text-[11px] tabular-nums">
                      {new Date(history.timestamp).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
