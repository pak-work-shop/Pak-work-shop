import React from 'react';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <section
      className={cn(
        'bg-industrial-grid border-b border-white/10 py-10 sm:py-14 text-[#F5F6F8]',
        className
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 text-start space-y-4">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs items={breadcrumbs} />
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <h1 className="text-3xl sm:text-5xl font-bold font-heading text-white leading-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm sm:text-base text-[#8A93A3] leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      </div>
    </section>
  );
}
