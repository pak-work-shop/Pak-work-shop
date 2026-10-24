import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  lightMode?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, lightMode = false, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;
    const errorId = `${textareaId}-error`;
    const hintId = `${textareaId}-hint`;

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label
            htmlFor={textareaId}
            className={cn(
              'block text-sm font-medium',
              lightMode ? 'text-[#12151A]' : 'text-[#F5F6F8]'
            )}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={cn(
            'w-full rounded-md px-3.5 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]',
            lightMode
              ? 'bg-white border border-slate-300 text-[#12151A] placeholder:text-slate-400'
              : 'bg-[#0E1013] border border-white/15 text-[#F5F6F8] placeholder:text-[#8A93A3]',
            error && 'border-[#DC2626] focus-visible:ring-[#DC2626]',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p id={hintId} className="text-xs text-[#8A93A3]">
            {hint}
          </p>
        )}
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-[#DC2626]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
