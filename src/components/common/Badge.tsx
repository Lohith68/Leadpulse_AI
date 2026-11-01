import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'hot' | 'warm' | 'cold' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'neutral', size = 'sm' }) => {
  const styles: Record<string, string> = {
    hot: 'bg-rose-50 text-rose-700 border border-rose-200 font-semibold',
    warm: 'bg-amber-50 text-amber-700 border border-amber-200 font-semibold',
    cold: 'bg-slate-100 text-slate-700 border border-slate-200 font-medium',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200 font-medium',
    danger: 'bg-red-50 text-red-700 border border-red-200 font-semibold',
    info: 'bg-sky-50 text-sky-700 border border-sky-200 font-medium',
    neutral: 'bg-gray-100 text-gray-700 border border-gray-200 font-medium',
    purple: 'bg-purple-50 text-purple-700 border border-purple-200 font-semibold',
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
