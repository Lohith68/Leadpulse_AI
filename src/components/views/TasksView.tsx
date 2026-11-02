import React, { useState, useMemo } from 'react';
import { 
  CheckSquare, Clock, Filter, AlertTriangle, ShieldCheck, 
  CheckCircle2, XCircle, Search, Calendar, UserCheck, ArrowUpRight 
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Task, TaskStatus, TaskPriority } from '../../types/crm';
import { Badge } from '../common/Badge';

export const TasksView: React.FC = () => {
  const { tasks, leads, companies, contacts, salesReps, updateTaskStatus } = useCRM();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const now = new Date().getTime();

  // Metrics calculation
  const metrics = useMemo(() => {
    let pending = 0;
    let inProgress = 0;
    let completed = 0;
    let overdue = 0;

    tasks.forEach(t => {
      if (t.status === 'COMPLETED') completed++;
      else if (t.status === 'IN_PROGRESS') inProgress++;
      else if (t.status === 'PENDING') pending++;

      if (t.status !== 'COMPLETED' && t.status !== 'CANCELLED' && new Date(t.dueDate).getTime() < now) {
        overdue++;
      }
    });

    return { total: tasks.length, pending, inProgress, completed, overdue };
  }, [tasks, now]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const lead = leads.find(l => l.id === t.leadId);
        const comp = lead ? companies.find(c => c.id === lead.companyId) : undefined;
        const cont = lead ? contacts.find(c => c.id === lead.contactId) : undefined;
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchId = t.id.toLowerCase().includes(q);
        const matchLead = `${comp?.name || ''} ${cont?.firstName || ''} ${cont?.lastName || ''}`.toLowerCase().includes(q);
        if (!matchTitle && !matchId && !matchLead) return false;
      }
      return true;
    });
  }, [tasks, statusFilter, priorityFilter, search, leads, companies, contacts]);

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await updateTaskStatus(task.id, newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Follow-up Task Automation & SLAs
            </h1>
            <Badge variant="purple" size="md">
              {tasks.length} Automated Tasks
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Automated SLA triggers (HOT: 1-Day, WARM: 3-Day, COLD: Nurture) with strict regulatory consent validation.
          </p>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Tasks</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{metrics.total}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">SLA Workflow Active</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Pending Action</div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 tabular-nums">{metrics.pending}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Awaiting Rep Touch</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">In Progress</div>
          <div className="text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6] mt-1 tabular-nums">{metrics.inProgress}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Outreach Active</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Completed</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{metrics.completed}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">SLA Fulfilled</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Overdue</div>
          <div className={`text-2xl font-bold mt-1 tabular-nums ${metrics.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
            {metrics.overdue}
          </div>
          <div className={`text-[11px] font-medium mt-1 ${metrics.overdue > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[#64748B] dark:text-[#94A3B8]'}`}>
            {metrics.overdue > 0 ? 'Breached SLA' : 'Zero Breaches'}
          </div>
        </div>
      </div>

      {/* Toolbar / Filters */}
      <div className="bg-white dark:bg-[#111C2E] p-4 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search task title, ID or prospect..."
            className="w-full bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] rounded-xl pl-9 pr-3 py-2 text-xs font-medium focus:outline-none focus:border-[#2563EB] transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="ALL">All Task Statuses</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN_PROGRESS</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="OVERDUE">OVERDUE</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB] cursor-pointer"
          >
            <option value="ALL">All Priority SLAs</option>
            <option value="URGENT_1_DAY">URGENT (1 Business Day SLA - HOT)</option>
            <option value="HIGH_3_DAY">HIGH (3 Business Days SLA - WARM)</option>
            <option value="NORMAL_NURTURE">NORMAL (Content Nurture - COLD)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] dark:bg-[#0B1220] border-b border-[#E2E8F0] dark:border-[#263449] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase tracking-wider">
                <th className="py-3 px-4">Task ID</th>
                <th className="py-3 px-4">Task Title & Prospect</th>
                <th className="py-3 px-4">SLA Priority</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Regulatory Consent</th>
                <th className="py-3 px-4">Assigned Rep</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#64748B] dark:text-[#94A3B8] font-medium">
                    No follow-up tasks match current filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const lead = leads.find(l => l.id === task.leadId);
                  const comp = lead ? companies.find(c => c.id === lead.companyId) : undefined;
                  const cont = lead ? contacts.find(c => c.id === lead.contactId) : undefined;
                  const rep = salesReps.find(r => r.id === task.assignedRepId);
                  const isOverdue =
                    task.status !== 'COMPLETED' &&
                    task.status !== 'CANCELLED' &&
                    new Date(task.dueDate).getTime() < now;

                  const isOptedOut = lead && (lead.consentStatus === 'OPTED_OUT' || lead.consentStatus === 'WITHDRAWN');

                  return (
                    <tr key={task.id} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">{task.id}</td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">{task.title}</div>
                        <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono mt-0.5">
                          Target: {task.leadId} {comp ? `· ${comp.name}` : ''} {cont ? `(${cont.firstName} ${cont.lastName})` : ''}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            task.priority === 'URGENT_1_DAY'
                              ? 'hot'
                              : task.priority === 'HIGH_3_DAY'
                              ? 'warm'
                              : 'neutral'
                          }
                        >
                          {task.priority === 'URGENT_1_DAY'
                            ? '1-Day SLA'
                            : task.priority === 'HIGH_3_DAY'
                            ? '3-Day SLA'
                            : 'Nurture'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block mt-0.5">OVERDUE</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {isOptedOut ? (
                          <Badge variant="danger">PROHIBITED (OPTED-OUT)</Badge>
                        ) : (
                          <Badge variant="success">Consent Verified</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-[#0F172A] dark:text-[#F8FAFC]">
                        {rep ? rep.name.split(' ')[0] : <span className="text-[#64748B] dark:text-[#94A3B8]">Unassigned</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge
                          variant={
                            task.status === 'COMPLETED'
                              ? 'success'
                              : task.status === 'CANCELLED'
                              ? 'neutral'
                              : isOverdue
                              ? 'danger'
                              : task.status === 'IN_PROGRESS'
                              ? 'info'
                              : 'warm'
                          }
                        >
                          {task.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                          <div className="flex items-center justify-end gap-1.5">
                            {task.status === 'PENDING' && (
                              <button
                                onClick={() => handleStatusChange(task, 'IN_PROGRESS')}
                                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-[#2563EB] dark:text-[#3B82F6] hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-[11px] font-semibold border border-blue-200 dark:border-blue-900/60 transition-colors"
                              >
                                Start
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(task, 'COMPLETED')}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded-lg text-[11px] font-semibold border border-emerald-200 dark:border-emerald-800 transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleStatusChange(task, 'CANCELLED')}
                              className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-[11px] font-medium transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
