import React from 'react';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedViewProps {
  onNavigateHome: () => void;
  requiredRole?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  onNavigateHome,
  requiredRole,
}) => {
  const { activeRole, actualRole, isDemoMode, setPreviewRole } = useAuth();

  return (
    <div className="min-h-[500px] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white dark:bg-[#111C2E] rounded-2xl border border-[#E2E8F0] dark:border-[#263449] shadow-xl p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 text-[11px] font-bold uppercase tracking-wider">
            <Lock className="w-3 h-3" />
            Access Restricted (RBAC)
          </div>
          <h2 className="text-xl font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
            Permission Required
          </h2>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
            Your current effective role <strong className="text-[#2563EB] dark:text-[#3B82F6]">"{activeRole}"</strong> does not possess the requisite clearance to access this module.
          </p>
          {requiredRole && (
            <p className="text-[11px] text-[#64748B] dark:text-[#94A3B8]">
              Authorized clearance level: <strong>{requiredRole}</strong>
            </p>
          )}
        </div>

        {isDemoMode && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800 text-left space-y-1 text-xs">
            <div className="font-bold text-amber-900 dark:text-amber-300">Preview Mode Notice</div>
            <p className="text-amber-800 dark:text-amber-400 text-[11px]">
              You are currently testing as <strong>{activeRole}</strong>. As an Administrator ({actualRole}), you can exit preview mode to restore unrestricted clearance.
            </p>
            <button
              onClick={() => setPreviewRole('Admin')}
              className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs transition-colors cursor-pointer"
            >
              Exit Preview &amp; Return to Admin
            </button>
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onNavigateHome}
            className="w-full py-2.5 px-4 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Return to Overview Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};
