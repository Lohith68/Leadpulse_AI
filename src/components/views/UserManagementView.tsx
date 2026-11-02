import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  KeyRound,
  Edit2,
  Lock,
  Mail,
  Loader2,
  Sparkles,
  AlertCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { CRMUser, UserRole, UserStatus, Territory } from '../../types/crm';
import { useAuth } from '../../context/AuthContext';
import {
  provisionNewUser,
  updateUserRole,
  updateUserStatus,
  dispatchPasswordReset,
  INITIAL_ADMIN_CONFIG,
} from '../../services/authService';
import { Badge } from '../common/Badge';

export const UserManagementView: React.FC = () => {
  const { userProfile, actualRole } = useAuth();
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editRoleUser, setEditRoleUser] = useState<CRMUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('Sales Representative');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // New user form state
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('Sales Representative');
  const [newTerritory, setNewTerritory] = useState<Territory>('North America');
  const [newPassword, setNewPassword] = useState('LeadPulse@2026');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subscribe to Firestore users collection
  useEffect(() => {
    const q = collection(db, 'users');
    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        const list: CRMUser[] = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data() as CRMUser);
        });
        setUsers(list);
        setLoading(false);
      },
      err => {
        console.warn('Error loading users from Firestore:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.assignedTerritory && u.assignedTerritory.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  const kpis = useMemo(() => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const adminOrManager = users.filter(u => u.role === 'Admin' || u.role === 'Sales Manager').length;
    const inactive = users.filter(u => u.status === 'inactive').length;
    return { total, active, adminOrManager, inactive };
  }, [users]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await provisionNewUser(userProfile, {
        name: newName,
        email: newEmail,
        role: newRole,
        temporaryPassword: newPassword,
        assignedTerritory: newTerritory,
      });
      setAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('LeadPulse@2026');
      setActionSuccess(`User account created successfully for ${newEmail}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to provision new user account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!userProfile || !editRoleUser) return;
    setIsSubmitting(true);
    setActionError(null);
    try {
      await updateUserRole(userProfile, editRoleUser.uid, editRoleUser.email, selectedRole);
      setEditRoleUser(null);
      setActionSuccess(`Updated role for ${editRoleUser.email} to ${selectedRole}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to update user role.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (targetUser: CRMUser) => {
    if (!userProfile) return;
    if (targetUser.email.toLowerCase() === INITIAL_ADMIN_CONFIG.email.toLowerCase()) {
      alert('The primary administrator account cannot be deactivated.');
      return;
    }
    const nextStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    try {
      await updateUserStatus(userProfile, targetUser.uid, targetUser.email, nextStatus);
      setActionSuccess(`Account for ${targetUser.email} is now ${nextStatus}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to toggle account status.');
    }
  };

  const handleSendReset = async (targetUser: CRMUser) => {
    if (!userProfile) return;
    try {
      await dispatchPasswordReset(userProfile.email, targetUser.email);
      setActionSuccess(`Password reset email sent to ${targetUser.email}.`);
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      setActionError(err?.message || 'Failed to dispatch password reset email.');
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'Admin':
        return <Badge variant="purple">Admin</Badge>;
      case 'Sales Manager':
        return <Badge variant="info">Sales Manager</Badge>;
      case 'Sales Representative':
        return <Badge variant="success">Sales Rep</Badge>;
      case 'Marketing':
        return <Badge variant="warning">Marketing</Badge>;
      case 'Analyst':
      default:
        return <Badge variant="neutral">Analyst</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-[#111C2E] p-6 rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              User Management &amp; Role Governance
            </h1>
            <Badge variant="purple" size="md">
              Admin Clearance
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-1 font-normal">
            Provision team accounts, configure RBAC access tiers, manage account lifecycle status, and dispatch password resets.
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-colors cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          Add New User
        </button>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 dark:text-emerald-400 font-bold">✕</button>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-600 dark:text-rose-400 font-bold">✕</button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Total Users</div>
          <div className="text-2xl font-bold text-[#0F172A] dark:text-[#F8FAFC] mt-1 tabular-nums">{kpis.total}</div>
          <div className="text-[11px] text-[#2563EB] dark:text-[#3B82F6] font-medium mt-1">Configured System Accounts</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Active Status</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">{kpis.active}</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">Granted CRM Clearance</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Admins &amp; Managers</div>
          <div className="text-2xl font-bold text-[#2563EB] dark:text-[#3B82F6] mt-1 tabular-nums">{kpis.adminOrManager}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Elevated Operational Roles</div>
        </div>

        <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]">Inactive Accounts</div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1 tabular-nums">{kpis.inactive}</div>
          <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-medium mt-1">Suspended / Deactivated</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-[#111C2E] border border-[#E2E8F0] dark:border-[#263449] rounded-2xl p-4 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#64748B] dark:text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user by name, email, or territory..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-[#E2E8F0] dark:border-[#263449] rounded-xl text-xs bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#64748B] dark:placeholder-[#94A3B8] focus:outline-none focus:border-[#2563EB]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8]">
              <Filter className="w-3.5 h-3.5" />
              <span>Role:</span>
            </div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              className="border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1220] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Sales Manager">Sales Manager</option>
              <option value="Sales Representative">Sales Representative</option>
              <option value="Marketing">Marketing</option>
              <option value="Analyst">Analyst</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-[#64748B] dark:text-[#94A3B8] ml-2">
              <span>Status:</span>
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="border border-[#E2E8F0] dark:border-[#263449] rounded-xl px-3 py-2 text-xs font-medium text-[#0F172A] dark:text-[#F8FAFC] bg-[#F8FAFC] dark:bg-[#0B1220] focus:outline-none focus:border-[#2563EB]"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto border border-[#E2E8F0] dark:border-[#263449] rounded-xl">
          <table className="w-full text-left text-xs text-[#0F172A] dark:text-[#F8FAFC]">
            <thead className="bg-[#F8FAFC] dark:bg-[#0B1220] text-[11px] font-bold text-[#64748B] dark:text-[#94A3B8] uppercase border-b border-[#E2E8F0] dark:border-[#263449]">
              <tr>
                <th className="px-4 py-3">User &amp; Email</th>
                <th className="px-4 py-3">Role Tier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Territory</th>
                <th className="px-4 py-3">Created / Last Login</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]/70 dark:divide-[#263449]/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#2563EB]" />
                    <span className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-2 block">Loading users...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-[#64748B] dark:text-[#94A3B8]">
                    No users matching the current filter.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isPrimaryAdmin = user.email.toLowerCase() === INITIAL_ADMIN_CONFIG.email.toLowerCase();
                  return (
                    <tr key={user.uid} className="hover:bg-[#F8FAFC]/70 dark:hover:bg-[#1E293B]/40 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#101B33] dark:bg-[#2563EB] text-white font-bold text-xs flex items-center justify-center shrink-0">
                            {user.name ? user.name[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
                              {user.name}
                              {isPrimaryAdmin && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-[#2563EB] dark:bg-blue-950 dark:text-blue-300 font-semibold">
                                  Initial Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">{getRoleBadge(user.role)}</td>

                      <td className="px-4 py-3.5">
                        {user.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold border border-emerald-200 dark:border-emerald-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 text-[10px] font-bold border border-rose-200 dark:border-rose-900/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 dark:bg-rose-400" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 text-[#0F172A] dark:text-[#F8FAFC] font-medium">
                        {user.assignedTerritory || 'Global'}
                      </td>

                      <td className="px-4 py-3.5 text-[#64748B] dark:text-[#94A3B8] text-[11px]">
                        <div>Created: {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</div>
                        <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                          Login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Change Role Button */}
                          <button
                            onClick={() => {
                              setEditRoleUser(user);
                              setSelectedRole(user.role);
                            }}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#64748B] dark:text-[#94A3B8] hover:text-[#2563EB] dark:hover:text-[#3B82F6] transition-colors cursor-pointer"
                            title="Change Role"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Send Password Reset */}
                          <button
                            onClick={() => handleSendReset(user)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-[#64748B] dark:text-[#94A3B8] hover:text-amber-600 transition-colors cursor-pointer"
                            title="Dispatch Password Reset Email"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Active Status */}
                          {!isPrimaryAdmin && (
                            <button
                              onClick={() => handleToggleStatus(user)}
                              className={`p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                                user.status === 'active'
                                  ? 'text-[#64748B] dark:text-[#94A3B8] hover:text-rose-600'
                                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-emerald-600'
                              }`}
                              title={user.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                            >
                              {user.status === 'active' ? (
                                <XCircle className="w-3.5 h-3.5" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New User Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] dark:border-[#263449] space-y-4">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#263449] pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">Provision New CRM User</h3>
              </div>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#263449] rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="jane.doe@company.com"
                  className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#263449] rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">RBAC Role</label>
                  <select
                    value={newRole}
                    onChange={e => setNewRole(e.target.value as UserRole)}
                    className="w-full px-2.5 py-2 border border-[#E2E8F0] dark:border-[#263449] rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="Sales Representative">Sales Representative</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Analyst">Analyst</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Territory</label>
                  <select
                    value={newTerritory}
                    onChange={e => setNewTerritory(e.target.value as Territory)}
                    className="w-full px-2.5 py-2 border border-[#E2E8F0] dark:border-[#263449] rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                  >
                    <option value="North America">North America</option>
                    <option value="EMEA">EMEA</option>
                    <option value="APAC">APAC</option>
                    <option value="LATAM">LATAM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">Temporary Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="LeadPulse@2026"
                  className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#263449] rounded-xl font-mono bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
                />
                <span className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-1 block">
                  User will be instructed to change password upon first login.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E2E8F0] dark:border-[#263449]">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create &amp; Provision User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editRoleUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-[#111C2E] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-[#E2E8F0] dark:border-[#263449] space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-[#E2E8F0] dark:border-[#263449] pb-3">
              <h3 className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">Change User Clearance Tier</h3>
              <button
                onClick={() => setEditRoleUser(null)}
                className="text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-white font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-[#64748B] dark:text-[#94A3B8]">
              Select the new access role for <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{editRoleUser.name}</strong> ({editRoleUser.email}):
            </p>

            <div>
              <label className="block font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">New Role</label>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 border border-[#E2E8F0] dark:border-[#263449] rounded-xl bg-[#F8FAFC] dark:bg-[#0B1220] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:border-[#2563EB]"
              >
                <option value="Admin">Admin</option>
                <option value="Sales Manager">Sales Manager</option>
                <option value="Sales Representative">Sales Representative</option>
                <option value="Marketing">Marketing</option>
                <option value="Analyst">Analyst</option>
              </select>
            </div>

            <div className="p-2.5 bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              Audit log will record this privilege modification.
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#263449]">
              <button
                type="button"
                onClick={() => setEditRoleUser(null)}
                className="px-3.5 py-1.5 rounded-xl border border-[#E2E8F0] dark:border-[#263449] text-[#64748B] dark:text-[#94A3B8] hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateRole}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Confirm Role Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
