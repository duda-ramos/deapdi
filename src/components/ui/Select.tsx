import React, { useId } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  placeholder,
  className = '',
  required,
  ...props
}) => {
  const generatedId = useId();
  const fieldId = props.id || props.name || generatedId;
  const errorId = `${fieldId}-error`;

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={fieldId} className="block text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <select
        id={fieldId}
        className={`w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-ink shadow-sm transition placeholder:text-gray-500 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 min-h-[2.75rem] ${
          error ? 'border-rose-500 focus-visible:border-rose-500 focus-visible:ring-rose-400/60' : ''
        } ${className}`}
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={error ? errorId : undefined}
        aria-required={required ? 'true' : undefined}
        {...props}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={errorId} className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};