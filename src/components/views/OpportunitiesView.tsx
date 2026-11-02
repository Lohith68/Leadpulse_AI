import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  ArrowRight,
  TrendingUp,
  LayoutGrid,
  List,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Opportunity, OpportunityStage } from '../../types/crm';
import { Badge } from '../common/Badge';
import { Modal } from '../common/Modal';

export const STAGES: OpportunityStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

export const OpportunitiesView: React.FC<{ onNavigate: (nav: string) => void }> = ({ onNavigate }) => {
  const { opportunities, leads, companies, salesReps, advanceOpportunity } = useCRM();

  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState('ALL');

  // Transition Modal State
  const [transitioningOpp, setTransitioningOpp] = useState<Opportunity | null>(null);
  const [targetStage, setTargetStage] = useState<OpportunityStage>('QUALIFIED');
  const [transitionNote, setTransitionNote] = useState('');
  const [wonReason, setWonReason] = useState('');
  const [lostReason, setLostReason] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const companiesMap = useMemo(() => new Map(companies.map(c => [c.id, c])), [companies]);
  const repsMap = useMemo(() => new Map(salesReps.map(r => [r.id, r])), [salesReps]);

  const filteredOpps = useMemo(() => {
    return opportunities.filter(opp => {
      const matchSearch =
        opp.name.toLowerCase().includes(search.toLowerCase()) ||
        opp.id.toLowerCase().includes(search.toLowerCase()) ||
        opp.leadId.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (stageFilter !== 'ALL' && opp.stage !== stageFilter) return false;
      return true;
    });
  }, [opportunities, search, stageFilter]);

  const totalPipeline = opportunities.reduce((acc, o) => acc + (o.value || 0), 0);
  const wonPipeline = opportunities.filter(o => o.stage === 'WON').reduce((acc, o) => acc + (o.value || 0), 0);

  const handleOpenTransitionModal = (opp: Opportunity, nextStage: OpportunityStage) => {
    setTransitioningOpp(opp);
    setTargetStage(nextStage);
    setTransitionNote('');
    setWonReason('');
    setLostReason('');
    setErrorMsg('');
  };

  const handleConfirmTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transitioningOpp) return;
    setErrorMsg('');

    try {
      await advanceOpportunity(transitioningOpp.id, targetStage, {
        wonReason,
        lostReason,
        note: transitionNote,
      });
      setTransitioningOpp(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Transition rejected by system security rules.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-5 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Opportunities Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-[#2563EB] dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
              {opportunities.length} Active Deals
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Stage progression (NEW &rarr; WON/LOST) with mandatory win/loss documentation and audit trails
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-xs">
            <span className="text-slate-400 dark:text-slate-500 block font-medium text-[11px] uppercase tracking-wider">Active Pipeline</span>
            <span className="font-mono text-base font-black text-[#2563EB] dark:text-[#3B82F6]">
              ${(totalPipeline / 1000).toFixed(0)}k Total · ${(wonPipeline / 1000).toFixed(0)}k Won
            </span>
          </div>

          <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 p-0.5">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white dark:bg-[#111C2E] shadow-xs text-[#0F172A] dark:text-[#F8FAFC]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-white dark:bg-[#111C2E] shadow-xs text-[#0F172A] dark:text-[#F8FAFC]' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search opportunity name, lead ID, deal ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#F1F5F9] dark:bg-[#0B1220] border border-transparent focus:border-[#2563EB] rounded-xl pl-9 pr-3 py-2 text-xs focus:outline-none text-[#0F172A] dark:text-[#F8FAFC]"
          />
        </div>

        <select
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value)}
          className="bg-[#F1F5F9] dark:bg-[#0B1220] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Stages</option>
          {STAGES.map(s => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto min-h-[500px]">
          {STAGES.map(stage => {
            const stageOpps = filteredOpps.filter(o => o.stage === stage);
            const stageValue = stageOpps.reduce((acc, o) => acc + (o.value || 0), 0);

            const stageBorder =
              stage === 'NEW'
                ? 'border-t-4 border-[#2563EB]'
                : stage === 'QUALIFIED'
                ? 'border-t-4 border-[#14B8A6]'
                : stage === 'PROPOSAL'
                ? 'border-t-4 border-[#8B5CF6]'
                : stage === 'NEGOTIATION'
                ? 'border-t-4 border-[#F59E0B]'
                : stage === 'WON'
                ? 'border-t-4 border-[#16A34A]'
                : 'border-t-4 border-[#64748B]';

            return (
              <div
                key={stage}
                className={`bg-[#F8FAFC] dark:bg-[#0F172A] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] ${stageBorder} p-3 flex flex-col min-w-[220px]`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <h3 className="text-xs font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-wide">{stage}</h3>
                    <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                      ${(stageValue / 1000).toFixed(0)}k
                    </span>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-[#111C2E] border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-center">
                    {stageOpps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[620px]">
                  {stageOpps.map(opp => {
                    const comp = companiesMap.get(opp.companyId);
                    const rep = repsMap.get(opp.assignedRepId);

                    return (
                      <div
                        key={opp.id}
                        className="bg-white dark:bg-[#111C2E] rounded-xl border border-[#E2E8F0] dark:border-[#263449] p-3 shadow-2xs hover:shadow-xs transition-shadow space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] font-bold text-[#2563EB] dark:text-[#3B82F6]">
                            {opp.id}
                          </span>
                          <span className="font-mono text-xs font-black text-[#0F172A] dark:text-[#F8FAFC]">
                            ${(opp.value / 1000).toFixed(0)}k
                          </span>
                        </div>

                        <div className="font-bold text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-snug line-clamp-2">
                          {opp.name}
                        </div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] truncate">
                          {comp?.name || opp.companyId}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500">
                          <span>{rep?.name?.split(' ')[0] || 'Rep'}</span>
                          <span>{new Date(opp.expectedCloseDate).toLocaleDateString()}</span>
                        </div>

                        {/* Quick Advance Controls */}
                        {stage !== 'WON' && stage !== 'LOST' && (
                          <div className="pt-1.5 flex items-center justify-between gap-1.5">
                            <button
                              onClick={() => {
                                const currIndex = STAGES.indexOf(stage);
                                const next = STAGES[currIndex + 1];
                                if (next) handleOpenTransitionModal(opp, next);
                              }}
                              className="flex-1 py-1 px-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-[#2563EB] dark:text-blue-300 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer"
                            >
                              Advance <ArrowRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleOpenTransitionModal(opp, 'LOST')}
                              className="py-1 px-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 hover:text-rose-700 text-slate-500 text-[10px] font-semibold transition-colors cursor-pointer"
                              title="Mark as Closed Lost"
                            >
                              Lost
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Opportunity ID</th>
                  <th className="py-3 px-4">Deal Name</th>
                  <th className="py-3 px-4">Account</th>
                  <th className="py-3 px-4">Deal Value</th>
                  <th className="py-3 px-4">Current Stage</th>
                  <th className="py-3 px-4">Assigned Rep</th>
                  <th className="py-3 px-4">Expected Close</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOpps.map(opp => {
                  const comp = companiesMap.get(opp.companyId);
                  const rep = repsMap.get(opp.assignedRepId);

                  return (
                    <tr key={opp.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-purple-700">{opp.id}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{opp.name}</td>
                      <td className="py-3 px-4 text-slate-600">{comp?.name || opp.companyId}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        ${opp.value.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            opp.stage === 'WON'
                              ? 'success'
                              : opp.stage === 'LOST'
                              ? 'danger'
                              : 'purple'
                          }
                        >
                          {opp.stage}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {rep?.name || 'Unassigned'}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(opp.expectedCloseDate).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {opp.stage !== 'WON' && opp.stage !== 'LOST' && (
                          <button
                            onClick={() => {
                              const currIndex = STAGES.indexOf(opp.stage);
                              const next = STAGES[currIndex + 1];
                              if (next) handleOpenTransitionModal(opp, next);
                            }}
                            className="px-2.5 py-1 rounded bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-semibold"
                          >
                            Advance
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transition Modal with Mandatory Reason */}
      <Modal
        isOpen={!!transitioningOpp}
        onClose={() => setTransitioningOpp(null)}
        title={`Advance Opportunity: ${transitioningOpp?.id}`}
        subtitle={`Transition from ${transitioningOpp?.stage} to ${targetStage}`}
        maxWidth="md"
      >
        <form onSubmit={handleConfirmTransition} className="space-y-4 text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-50 text-red-700 border border-red-200">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Target Stage *</label>
            <select
              value={targetStage}
              onChange={e => setTargetStage(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
            >
              {STAGES.filter(s => s !== transitioningOpp?.stage).map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Transition Reason / Notes</label>
            <textarea
              value={transitionNote}
              onChange={e => setTransitionNote(e.target.value)}
              placeholder="Completed technical architecture evaluation..."
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
            />
          </div>

          {targetStage === 'WON' && (
            <div>
              <label className="block font-semibold text-emerald-800 mb-1">
                Documented Won Reason (Mandatory) *
              </label>
              <textarea
                value={wonReason}
                onChange={e => setWonReason(e.target.value)}
                required
                placeholder="Why did the customer choose LEADPULSE? (e.g. Superior compliance architecture and fast integration)"
                rows={2}
                className="w-full bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>
          )}

          {targetStage === 'LOST' && (
            <div>
              <label className="block font-semibold text-rose-800 mb-1">
                Documented Lost Reason (Mandatory) *
              </label>
              <textarea
                value={lostReason}
                onChange={e => setLostReason(e.target.value)}
                required
                placeholder="Why was the opportunity lost? (e.g. Budget postponed to 2027)"
                rows={2}
                className="w-full bg-rose-50 border border-rose-200 rounded-lg p-2 text-xs text-slate-900"
              />
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setTransitioningOpp(null)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-purple-700 hover:bg-purple-800 text-white font-semibold"
            >
              Commit Transition & Log Audit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
