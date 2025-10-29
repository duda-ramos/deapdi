import React from 'react';
import { sanitizeText } from '../../utils/security';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  sanitize?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  sanitize = false,
  className = '',
  onChange,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!onChange) return;
    
    if (sanitize) {
      // Create a new event with sanitized value
      const sanitizedValue = sanitizeText(e.target.value);
      
      // Clone the event to avoid React synthetic event reuse issues
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          value: sanitizedValue
        }
      };
      
      onChange(newEvent as React.ChangeEvent<HTMLTextAreaElement>);
    } else {
      onChange(e);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <textarea
        className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
          error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : ''
        } ${className}`}
        rows={4}
        onChange={handleChange}
        {...props}
      />
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};