import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'default'
  | 'neutral'
  | 'primary'
  | 'orange'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const badgeStyles: Record<BadgeVariant, string> = {
  default: 'bg-[#2A2F38] text-[#F5F6F8] border-white/15',
  neutral: 'bg-[#2A2F38] text-[#F5F6F8] border-white/15',
  primary: 'bg-[#FF6A00]/15 text-[#FF6A00] border-[#FF6A00]/30',
  orange: 'bg-[#FF6A00]/15 text-[#FF6A00] border-[#FF6A00]/30',
  accent: 'bg-[#FFC21A]/15 text-[#FFC21A] border-[#FFC21A]/30',
  success: 'bg-[#16A34A]/15 text-emerald-400 border-[#16A34A]/30',
  warning: 'bg-[#D97706]/15 text-amber-400 border-[#D97706]/30',
  danger: 'bg-[#DC2626]/15 text-red-400 border-[#DC2626]/30',
  info: 'bg-[#0284C7]/15 text-sky-400 border-[#0284C7]/30',
};

export function Badge({ className, variant = 'default', children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded px-2.5 py-0.5 text-xs font-semibold border whitespace-nowrap',
        badgeStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
