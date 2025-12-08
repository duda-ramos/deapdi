import React from 'react';
import { sanitizeText } from '../../utils/security';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  sanitize?: boolean;
}

const InputComponent: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  sanitize = false,
  className = '',
  onChange,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!onChange) return;
    
    if (sanitize) {
      // Create a new event with sanitized value
      // We use Object.defineProperty to make it work like a native event
      const sanitizedValue = sanitizeText(e.target.value);
      
      // Clone the event to avoid React synthetic event reuse issues
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue
        }
      };
      
      onChange(newEvent as React.ChangeEvent<HTMLInputElement>);
    } else {
      onChange(e);
    }
  };

  const fieldId = props.id || props.name;
  const errorId = fieldId ? `${fieldId}-error` : undefined;
  const descriptionId = fieldId ? `${fieldId}-description` : undefined;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition placeholder:text-gray-500 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem] ${
          error ? 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-400/60' : ''
        } ${className}`}
        onChange={handleChange}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : helperText ? descriptionId : undefined}
        {...props}
      />
      {error && (
        <p id={errorId} className="text-xs text-rose-600">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={descriptionId} className="text-xs text-muted">
          {helperText}
        </p>
      )}
    </div>
  );
};

// Memoize to prevent unnecessary re-renders
export const Input = React.memo(InputComponent);
Input.displayName = 'Input';