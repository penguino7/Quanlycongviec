import React from 'react';
import { Task } from '../context/TaskContext';
import { AlertTriangle } from 'lucide-react';

type PriorityBadgeProps = {
  priority: Task['priority'];
  className?: string;
  showIcon?: boolean;
};

export const PriorityBadge = ({ priority, className = '', showIcon = true }: PriorityBadgeProps) => {
  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'text-rose-600 dark:text-rose-400';
      case 'medium':
        return 'text-amber-500 dark:text-amber-400';
      case 'low':
        return 'text-emerald-500 dark:text-emerald-400';
      default:
        return 'text-gray-500 dark:text-gray-400';
    }
  };

  const getPriorityLabel = () => {
    switch (priority) {
      case 'high':
        return 'Cao';
      case 'medium':
        return 'Trung bình';
      case 'low':
        return 'Thấp';
      default:
        return 'Không rõ';
    }
  };

  return (
    <span className={`flex items-center gap-1 ${getPriorityColor()} ${className}`}>
      {showIcon && <AlertTriangle className="w-3.5 h-3.5" />}
      <span className="text-xs font-medium">{getPriorityLabel()}</span>
    </span>
  );
};
