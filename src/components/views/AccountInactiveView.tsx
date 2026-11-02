import React from 'react';
import { UserX, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AccountInactiveView: React.FC = () => {
  const { logout, userProfile, currentUser } = useAuth();

  return (
    <div className="min-h-screen bg-[#0B1428] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-2xl p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-inner">
          <UserX className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
            Account Inactive / Suspended
          </div>
          <h2 className="text-xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            Account Access Deactivated
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            The account associated with <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{userProfile?.email || currentUser?.email}</strong> is currently set to inactive status in the LeadPulse AI CRM governance registry.
          </p>
        </div>

        <div className="bg-[#F8FAFC] dark:bg-[#0B1220] border border-[#E2E8F0] dark:border-[#263449] rounded-xl p-4 text-xs text-[#64748B] dark:text-[#94A3B8] text-left space-y-2">
          <div className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-[#2563EB] dark:text-[#3B82F6]" />
            Contact Administrator
          </div>
          <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            To restore access or reactivate this account, please contact your LeadPulse Administrator:
          </p>
          <div className="text-[11px] font-mono text-[#2563EB] dark:text-[#3B82F6] bg-blue-50 dark:bg-blue-950/40 p-2 rounded border border-blue-200 dark:border-blue-900">
            lohithgopisetti@gmail.com
          </div>
        </div>

        <button
          onClick={() => logout()}
          className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Sign Out of Account
        </button>
      </div>
    </div>
  );
};
