import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface AccordionItemData {
  id: string;
  question: string;
  answer: string;
  badge?: string;
}

export interface AccordionProps {
  items: AccordionItemData[];
  lightMode?: boolean;
  defaultOpenId?: string;
  className?: string;
}

export function Accordion({
  items,
  lightMode = true,
  defaultOpenId,
  className,
}: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId ?? null);

  const toggleItem = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item) => {
        const isOpen = openId === item.id;
        const panelId = `accordion-panel-${item.id}`;
        const buttonId = `accordion-btn-${item.id}`;

        return (
          <div
            key={item.id}
            className={cn(
              'rounded-lg border transition-colors text-start',
              lightMode
                ? isOpen
                  ? 'bg-white border-[#FF6A00] shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300'
                : isOpen
                  ? 'bg-[#1B1F26] border-[#FF6A00]'
                  : 'bg-[#1B1F26] border-white/10 hover:border-white/20'
            )}
          >
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => toggleItem(item.id)}
                className={cn(
                  'w-full flex items-center justify-between gap-4 px-5 py-4 text-start font-heading font-bold text-base sm:text-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00] rounded-lg',
                  lightMode ? 'text-[#12151A]' : 'text-white'
                )}
              >
                <span className="flex flex-wrap items-center gap-2.5">
                  <span>{item.question}</span>
                  {item.badge && (
                    <span className="text-xs font-sans font-semibold px-2 py-0.5 rounded bg-[#FF6A00]/10 text-[#FF6A00]">
                      {item.badge}
                    </span>
                  )}
                </span>
                <ChevronDown
                  className={cn(
                    'w-5 h-5 shrink-0 text-[#FF6A00] transition-transform duration-150',
                    isOpen && 'rotate-180'
                  )}
                />
              </button>
            </h3>

            {isOpen && (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={cn(
                  'px-5 pb-5 pt-1 text-sm sm:text-base leading-relaxed border-t',
                  lightMode
                    ? 'text-slate-600 border-slate-100'
                    : 'text-[#8A93A3] border-white/10'
                )}
              >
                {item.answer}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
