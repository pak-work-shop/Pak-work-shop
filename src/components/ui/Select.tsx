import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  lightMode?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, placeholder, error, id, lightMode = false, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const hasEmptyOption = options.some((opt) => opt.value === '');

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label
            htmlFor={selectId}
            className={cn(
              'block text-sm font-medium',
              lightMode ? 'text-[#12151A]' : 'text-[#F5F6F8]'
            )}
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full rounded-md px-3.5 py-2.5 text-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF6A00]',
            lightMode
              ? 'bg-white border border-slate-300 text-[#12151A]'
              : 'bg-[#0E1013] border border-white/15 text-[#F5F6F8]',
            error && 'border-[#DC2626] focus-visible:ring-[#DC2626]',
            className
          )}
          {...props}
        >
          {placeholder && !hasEmptyOption && (
            <option value="">{placeholder}</option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={errorId} role="alert" className="text-xs font-medium text-[#DC2626]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
