import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  lightMode?: boolean;
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeading({
  title,
  subtitle,
  lightMode = true,
  actions,
  className,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 text-start',
        className
      )}
    >
      <div className="max-w-2xl">
        <h2
          className={cn(
            'text-2xl sm:text-4xl font-bold font-heading heading-accent mb-4',
            lightMode ? 'text-[#12151A]' : 'text-white'
          )}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            className={cn(
              'text-sm sm:text-base',
              lightMode ? 'text-slate-600' : 'text-[#8A93A3]'
            )}
          >
            {subtitle}
          </p>
        )}
      </div>

      {actions && <div className="shrink-0">{actions}</div>}
    </div>
  );
}
