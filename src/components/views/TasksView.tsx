import React, { useState, useMemo } from 'react';
import { CheckSquare, Clock, Filter, AlertTriangle, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Task, TaskStatus, TaskPriority } from '../../types/crm';
import { Badge } from '../common/Badge';

export const TasksView: React.FC = () => {
  const { tasks, leads, salesReps, updateTaskStatus } = useCRM();

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const now = new Date().getTime();

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, statusFilter, priorityFilter]);

  const handleStatusChange = async (task: Task, newStatus: TaskStatus) => {
    await updateTaskStatus(task.id, newStatus);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Follow-up Task Automation & SLAs
            </h1>
            <Badge variant="purple" size="md">
              {tasks.length} Automated Tasks
            </Badge>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Score-triggered follow-up SLAs (HOT: 1-Day, WARM: 3-Day, COLD: Nurture) with consent enforcement
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
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
          className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Priority SLAs</option>
          <option value="URGENT_1_DAY">URGENT (1 Business Day SLA - HOT)</option>
          <option value="HIGH_3_DAY">HIGH (3 Business Days SLA - WARM)</option>
          <option value="NORMAL_NURTURE">NORMAL (Content Nurture - COLD)</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
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
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                    No follow-up tasks match current filters.
                  </td>
                </tr>
              ) : (
                filteredTasks.map(task => {
                  const lead = leads.find(l => l.id === task.leadId);
                  const rep = salesReps.find(r => r.id === task.assignedRepId);
                  const isOverdue =
                    task.status !== 'COMPLETED' &&
                    task.status !== 'CANCELLED' &&
                    new Date(task.dueDate).getTime() < now;

                  const isOptedOut = lead && (lead.consentStatus === 'OPTED_OUT' || lead.consentStatus === 'WITHDRAWN');

                  return (
                    <tr key={task.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">{task.id}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{task.title}</div>
                        <div className="text-[11px] text-slate-400 font-mono">Target: {task.leadId}</div>
                      </td>
                      <td className="py-3 px-4">
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
                      <td className="py-3 px-4">
                        <div className="font-medium text-slate-800">
                          {new Date(task.dueDate).toLocaleDateString()}
                        </div>
                        {isOverdue && (
                          <span className="text-[10px] text-rose-600 font-bold block">OVERDUE</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isOptedOut ? (
                          <Badge variant="danger">PROHIBITED (OPTED-OUT)</Badge>
                        ) : (
                          <Badge variant="success">Consent Verified</Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-700">
                        {rep ? rep.name.split(' ')[0] : <span className="text-slate-400">Unassigned</span>}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            task.status === 'COMPLETED'
                              ? 'success'
                              : task.status === 'CANCELLED'
                              ? 'neutral'
                              : isOverdue
                              ? 'danger'
                              : 'info'
                          }
                        >
                          {task.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleStatusChange(task, 'COMPLETED')}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded text-[11px] font-bold transition-colors"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => handleStatusChange(task, 'CANCELLED')}
                              className="px-2 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded text-[11px] font-semibold transition-colors"
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
