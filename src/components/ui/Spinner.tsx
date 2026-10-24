import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

const sizeMap = {
  sm: 'w-4 h-4',
  md: 'w-7 h-7',
  lg: 'w-10 h-10',
};

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  return (
    <div className="inline-flex flex-col items-center justify-center gap-2" role="status">
      <Loader2 className={cn('animate-spin text-[#FF6A00]', sizeMap[size], className)} />
      {label && <span className="text-xs text-[#8A93A3]">{label}</span>}
    </div>
  );
}
