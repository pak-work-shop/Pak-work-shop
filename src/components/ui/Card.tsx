import React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'dark' | 'dark-elevated' | 'light';
}

export function Card({ className, variant = 'dark', children, ...props }: CardProps) {
  const variantStyles = {
    dark: 'bg-[#1B1F26] border border-white/10 text-[#F5F6F8]',
    'dark-elevated': 'bg-[#2A2F38] border border-white/15 text-[#F5F6F8]',
    light: 'bg-white border border-slate-200 text-[#12151A] shadow-sm',
  };

  return (
    <div
      className={cn('rounded-lg p-6 transition-colors duration-150', variantStyles[variant], className)}
      {...props}
    >
      {children}
    </div>
  );
}
