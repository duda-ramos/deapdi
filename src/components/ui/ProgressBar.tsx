import React from 'react';
import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  max = 100,
  className = '',
  showLabel = false,
  color = 'blue'
}) => {
  const percentage = Math.min((progress / max) * 100, 100);
  
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="flex justify-between items-center mb-2">
        {showLabel && (
          <span className="text-sm font-medium text-gray-700">
            {progress}/{max}
          </span>
        )}
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${colors[color]}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};