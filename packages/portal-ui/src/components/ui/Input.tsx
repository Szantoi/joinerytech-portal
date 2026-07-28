import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={className}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink mb-1">
            {label}
            {props.required && <span className="text-rose-600 dark:text-rose-400 ml-1">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            bg-surface-card text-ink placeholder:text-ink-soft
            focus:outline-none focus:ring-2 focus:ring-world-ring focus:border-world-ring
            disabled:bg-surface-2 disabled:text-ink-muted disabled:cursor-not-allowed
            ${error ? 'border-rose-400 dark:border-rose-700' : 'border-line'}
          `}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-rose-600 dark:text-rose-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
