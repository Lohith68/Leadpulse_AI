import React, { useState } from 'react';
import {
  Activity,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Loader2,
  UserCheck,
  TrendingUp,
  BrainCircuit,
  BarChart2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import { INITIAL_ADMIN_CONFIG, BENCHMARK_ACCOUNTS } from '../../services/authService';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please provide both email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      console.error('Sign in error:', err);
      const code = err?.code;
      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/wrong-password' ||
        code === 'auth/user-not-found'
      ) {
        setError('Invalid credentials. Please verify your email and password.');
      } else if (code === 'auth/too-many-requests') {
        setError('Access temporarily disabled due to multiple failed login attempts. Please try again shortly or reset your password.');
      } else {
        setError(err?.message || 'Authentication failed. Please verify credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fillQuickAccount = (accEmail: string, accPass: string) => {
    setEmail(accEmail);
    setPassword(accPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#101B33] flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans selection:bg-[#2563EB] selection:text-white relative overflow-hidden">
      {/* Background AI & Sales Intelligence Visual Graphics */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="meshGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#101B33" stopOpacity="0" />
            </radialGradient>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#2563EB" strokeWidth="0.5" strokeOpacity="0.25" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          <circle cx="85%" cy="20%" r="350" fill="url(#meshGradient)" />
          <circle cx="15%" cy="80%" r="400" fill="url(#meshGradient)" />
        </svg>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#2563EB] shadow-xl shadow-blue-600/30 text-white mb-1">
            <Activity className="w-8 h-8 text-white" />
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              LEADPULSE
            </h1>
            <span className="px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 text-xs font-black border border-blue-400/30">
              AI CRM
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-sm mx-auto font-medium">
            Intelligent Lead Scoring &amp; Sales Automation Platform · Team Agentrax
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white dark:bg-[#111C2E] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-[#263449] p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-black text-[#0F172A] dark:text-[#F8FAFC] tracking-tight">
              Enterprise Workspace Access
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Sign in to access your business intelligence dashboard
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-[#DC2626] dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@leadpulse.ai"
                  className="w-full pl-10 pr-3 py-2.5 text-xs bg-slate-50 dark:bg-[#0B1220] hover:bg-slate-100/60 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-[#111C2E] border border-slate-200 dark:border-[#263449] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400 font-medium transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-[11px] font-semibold text-[#2563EB] dark:text-[#3B82F6] hover:underline transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-xs bg-slate-50 dark:bg-[#0B1220] hover:bg-slate-100/60 dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-[#111C2E] border border-slate-200 dark:border-[#263449] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#0F172A] dark:text-[#F8FAFC] placeholder:text-slate-400 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
                />
                <span className="text-[#64748B] dark:text-[#94A3B8] font-medium text-[11px]">
                  Keep me signed in
                </span>
              </label>

              <span className="text-[11px] text-slate-400 flex items-center gap-1 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                RBAC Protected
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-blue-600 text-white font-black text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Platform</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Sandbox Login Presets */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#2563EB]" />
                Evaluation Role Sandbox
              </span>
              <span className="text-[10px] text-[#2563EB] font-bold">1-Click Test Presets</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Primary Admin */}
              <button
                type="button"
                onClick={() => fillQuickAccount(INITIAL_ADMIN_CONFIG.email, INITIAL_ADMIN_CONFIG.password)}
                className="col-span-full p-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-left transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                    {INITIAL_ADMIN_CONFIG.name}
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-200 dark:bg-blue-800 text-[#2563EB] dark:text-blue-200 font-black">
                      Admin
                    </span>
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] font-mono mt-0.5">
                    {INITIAL_ADMIN_CONFIG.email}
                  </div>
                </div>
                <span className="text-[11px] font-bold text-[#2563EB] group-hover:translate-x-0.5 transition-transform">
                  Load &rarr;
                </span>
              </button>

              {/* Other 4 Roles */}
              {BENCHMARK_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillQuickAccount(acc.email, acc.password)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer"
                >
                  <div className="text-[11px] font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                    {acc.name}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-800 text-[#64748B] dark:text-[#94A3B8] font-semibold">
                      {acc.role}
                    </span>
                    <span className="text-[10px] text-[#2563EB] font-bold">Load</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-[11px] text-slate-400 space-y-1">
          <div>LEADPULSE AI · Enterprise Cloud CRM Standard 2026.10</div>
          <div className="text-slate-500 text-[10px]">Deterministic Seed: 20261022 · Cloud Firestore</div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        defaultEmail={email}
      />
    </div>
  );
};
