import React from 'react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../../lib/utils';

export interface MarkdownProps {
  content: string;
  lightMode?: boolean;
  className?: string;
}

/**
 * Safe wrapper around react-markdown.
 * Raw HTML is disallowed by default (skipHtml=true, no rehype-raw).
 * Links receive rel="noopener noreferrer", and external links open in a new tab.
 */
export function Markdown({ content, lightMode = true, className }: MarkdownProps) {
  const headingColor = lightMode ? 'text-[#12151A]' : 'text-white';
  const bodyColor = lightMode ? 'text-slate-700' : 'text-[#F5F6F8]';
  const strongColor = lightMode ? 'text-[#12151A]' : 'text-white';

  return (
    <div className={cn('space-y-4 text-start leading-relaxed', bodyColor, className)}>
      <ReactMarkdown
        skipHtml
        components={{
          h1: ({ children }) => (
            <h2
              className={cn(
                'text-2xl sm:text-3xl font-bold font-heading pt-4 pb-1',
                headingColor
              )}
            >
              {children}
            </h2>
          ),
          h2: ({ children }) => (
            <h2
              className={cn(
                'text-xl sm:text-2xl font-bold font-heading pt-4 pb-1 border-b',
                headingColor,
                lightMode ? 'border-slate-200' : 'border-white/10'
              )}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              className={cn(
                'text-lg sm:text-xl font-bold font-heading pt-3',
                headingColor
              )}
            >
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-sm sm:text-base leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc ps-6 space-y-2 text-sm sm:text-base">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal ps-6 space-y-2 text-sm sm:text-base">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-relaxed">{children}</li>,
          strong: ({ children }) => (
            <strong className={cn('font-semibold', strongColor)}>{children}</strong>
          ),
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ href, children }) => {
            const safeHref =
              href && /^(https?:\/\/|mailto:|tel:|\/)/i.test(href) ? href : '#';
            const isExternal = /^https?:\/\//i.test(safeHref);
            return (
              <a
                href={safeHref}
                target={isExternal ? '_blank' : undefined}
                rel="noopener noreferrer"
                className="text-[#FF6A00] hover:underline font-medium"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content || ''}
      </ReactMarkdown>
    </div>
  );
}
