import React, { useId } from 'react';
import { Check } from 'lucide-react';

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  id?: string;
  name?: string;
  helperText?: string;
  'aria-label'?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({
  checked,
  onChange,
  disabled = false,
  label,
  className = '',
  id: providedId,
  name,
  helperText,
  'aria-label': ariaLabel,
  ...props
}) => {
  const generatedId = useId();
  const checkboxId = providedId || generatedId;
  const helperId = helperText ? `${checkboxId}-helper` : undefined;

  return (
    <div className={className}>
      <label 
        htmlFor={checkboxId}
        className={`flex items-center space-x-2 cursor-pointer ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="relative">
          <input
            type="checkbox"
            id={checkboxId}
            name={name}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
            className="sr-only"
            aria-checked={checked}
            aria-describedby={helperId}
            aria-label={!label ? ariaLabel : undefined}
            {...props}
          />
          <div
            className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center ${
              checked
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-300 hover:border-gray-400'
            } ${disabled ? 'opacity-50' : ''}`}
            aria-hidden="true"
          >
            {checked && <Check size={12} aria-hidden="true" />}
          </div>
        </div>
        {label && (
          <span className={`text-sm ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>
            {label}
          </span>
        )}
      </label>
      {helperText && (
        <p id={helperId} className="text-sm text-gray-500 mt-1 ml-7">
          {helperText}
        </p>
      )}
    </div>
  );
};