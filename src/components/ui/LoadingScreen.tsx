import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ 
  message = 'Carregando...', 
  size = 'md' 
}) => {
  const sizes = {
    sm: 'h-32 w-32',
    md: 'h-32 w-32',
    lg: 'h-48 w-48'
  };

  const spinnerSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className={`animate-spin rounded-full ${spinnerSizes[size]} border-b-2 border-blue-600 mx-auto mb-4`}
        />
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  );
};