import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
  lightMode?: boolean;
}

export function Breadcrumbs({ items, className, lightMode = false }: BreadcrumbsProps) {
  const { t } = useTranslation();

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        'flex flex-wrap items-center gap-1.5 text-xs sm:text-sm',
        lightMode ? 'text-slate-600' : 'text-[#8A93A3]',
        className
      )}
    >
      <Link
        to="/"
        className={cn(
          'inline-flex items-center gap-1 transition-colors',
          lightMode ? 'hover:text-[#FF6A00]' : 'hover:text-white'
        )}
      >
        <Home className="w-3.5 h-3.5 text-[#FF6A00]" />
        <span>{t('nav.home')}</span>
      </Link>

      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${idx}`}>
            <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-60 rtl-flip" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className={cn(
                  'transition-colors',
                  lightMode ? 'hover:text-[#FF6A00]' : 'hover:text-white'
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                aria-current={isLast ? 'page' : undefined}
                className={cn(
                  'font-medium truncate max-w-[240px] sm:max-w-md',
                  lightMode ? 'text-[#12151A]' : 'text-[#F5F6F8]'
                )}
              >
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
