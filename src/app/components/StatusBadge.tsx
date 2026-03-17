import React from 'react';
import { Task } from '../context/TaskContext';

type StatusBadgeProps = {
  status: Task['status'];
  className?: string;
};

export const StatusBadge = ({ status, className = '' }: StatusBadgeProps) => {
  const getStatusColor = () => {
    switch (status) {
      case 'done':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'in-progress':
        return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'todo':
        return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'done':
        return 'Hoàn thành';
      case 'in-progress':
        return 'Đang làm';
      case 'todo':
        return 'Cần làm';
      default:
        return 'Không rõ';
    }
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border flex items-center justify-center w-max ${getStatusColor()} ${className}`}>
      {getStatusLabel()}
    </span>
  );
};
