import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'hot' | 'warm' | 'cold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple' | 'teal';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const styles: Record<string, string> = {
    hot: 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-900/60 font-semibold',
    warm: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/60 font-semibold',
    cold: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-900/60 font-medium',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/60 font-medium',
    danger: 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-900/60 font-semibold',
    info: 'bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-950/50 dark:text-sky-400 dark:border-sky-900/60 font-medium',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium',
    purple: 'bg-blue-50 text-[#2563EB] border border-blue-200 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60 font-semibold',
    teal: 'bg-teal-50 text-[#14B8A6] border border-teal-200 dark:bg-teal-950/50 dark:text-teal-400 dark:border-teal-900/60 font-semibold',
  };

  const sizes: Record<string, string> = {
    sm: 'text-xs px-2 py-0.5 rounded-md',
    md: 'text-sm px-2.5 py-1 rounded-lg',
  };

  return (
    <span className={`inline-flex items-center gap-1 leading-none ${styles[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
};
