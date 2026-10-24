import React from 'react';
import { Wrench } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-8 rounded-lg border border-dashed border-white/15 bg-[#1B1F26]/60',
        className
      )}
    >
      <div className="w-12 h-12 rounded-full bg-[#2A2F38] flex items-center justify-center text-[#FF6A00] mb-4">
        {icon || <Wrench className="w-6 h-6" />}
      </div>
      <h3 className="text-lg font-bold font-heading text-[#F5F6F8] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#8A93A3] max-w-md mb-5">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}
