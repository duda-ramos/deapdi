import React from 'react';
import { motion } from 'framer-motion';

interface TimelineItem {
  id: string;
  date: string;
  title: string;
  description?: string;
  amount?: number;
  type?: 'salary' | 'promotion' | 'achievement' | 'default';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ items, className = '' }) => {
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'salary':
        return 'bg-green-500';
      case 'promotion':
        return 'bg-blue-500';
      case 'achievement':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'salary':
        return '💰';
      case 'promotion':
        return '🚀';
      case 'achievement':
        return '🏆';
      default:
        return '📅';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="relative flex items-start space-x-4"
        >
          {/* Timeline line */}
          {index < items.length - 1 && (
            <div className="absolute left-6 top-12 w-0.5 h-16 bg-gray-200" />
          )}
          
          {/* Timeline dot */}
          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${getTypeColor(item.type || 'default')} flex items-center justify-center text-white text-lg`}>
            {getTypeIcon(item.type || 'default')}
          </div>
          
          {/* Content */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
              <span className="text-sm text-gray-500">{item.date}</span>
            </div>
            {item.description && (
              <p className="text-gray-600 mb-2">{item.description}</p>
            )}
            {item.amount && (
              <div className="text-lg font-bold text-green-600">
                R$ {item.amount.toLocaleString('pt-BR')}
              </div>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};