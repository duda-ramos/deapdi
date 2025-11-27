import React, { useId } from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange';
  label?: string;
  'aria-label'?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  max = 100,
  className = '',
  showLabel = false,
  color = 'blue',
  label,
  'aria-label': ariaLabel
}) => {
  const labelId = useId();
  const percentage = Math.min((progress / max) * 100, 100);
  
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  const progressLabel = ariaLabel || label || 'Progresso';
  const valueText = `${progress} de ${max} (${percentage.toFixed(0)}%)`;

  return (
    <div className={`w-full ${className}`}>
      {(label || showLabel) && (
        <div className="flex justify-between items-center mb-2">
          {label && (
            <span id={labelId} className="text-sm font-medium text-gray-700">
              {label}
            </span>
          )}
          {showLabel && (
            <span className="text-sm font-medium text-gray-700" aria-hidden="true">
              {progress}/{max}
            </span>
          )}
        </div>
      )}
      <div 
        className="w-full bg-gray-200 rounded-full h-2"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuetext={valueText}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? progressLabel : undefined}
      >
        <motion.div
          className={`h-2 rounded-full ${colors[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          aria-hidden="true"
        />
      </div>
    </div>
  );
};