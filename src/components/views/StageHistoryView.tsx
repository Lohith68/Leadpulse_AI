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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Opportunity Stage History Audit Log
            </h1>
            <Badge variant="purple" size="md">
              {stageHistories.length} Transition Logs
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable transition audit records verifying pipeline movement, stage cycle velocity, and authorization
          </p>
        </div>
      </div>

      {/* Cycle Time Velocity Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {avgDurations.map(stat => (
          <div key={stat.stage} className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
              <span>{stat.stage} Velocity</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <div className="mt-2 text-2xl font-black text-slate-900 font-mono">
              {stat.avgDays} <span className="text-xs font-normal text-slate-400">days avg</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Across {stat.count} transition events
            </div>
          </div>
        ))}
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Audit ID</th>
                <th className="py-3 px-4">Opportunity</th>
                <th className="py-3 px-4">Stage Transition</th>
                <th className="py-3 px-4">Prior Stage Duration</th>
                <th className="py-3 px-4">Transition Rationale</th>
                <th className="py-3 px-4">Authorized By</th>
                <th className="py-3 px-4 text-right">Event Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stageHistories.map(history => {
                const opp = oppsMap.get(history.opportunityId);
                return (
                  <tr key={history.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700">{history.id}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{opp?.name || history.opportunityId}</div>
                      <span className="font-mono text-[10px] text-purple-700">{history.opportunityId}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 font-bold">
                        <span className="text-slate-500">{history.fromStage}</span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="text-purple-700">{history.toStage}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-700">
                      {history.durationDays} days
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {history.transitionReason || 'Standard stage advancement.'}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium">{history.changedBy}</td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
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
