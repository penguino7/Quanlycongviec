import React, { useState, useRef, useEffect } from 'react';
import { useTasks, Task } from '../context/TaskContext';
import { Search, Plus, Trash2, Calendar, Clock, AlertTriangle, ChevronDown, Check, CheckCircle2, PlayCircle } from 'lucide-react';
import { Link } from 'react-router';
import { format, parseISO } from 'date-fns';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const Tasks = () => {
  const { tasks, updateTask, deleteTask } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target as Node)) {
        setIsPriorityDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    return matchesSearch && matchesPriority;
  });

  const priorityOptions = [
    { value: 'all', label: 'All Priorities' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
  ];

  const getSelectedPriorityLabel = () => {
    return priorityOptions.find(opt => opt.value === filterPriority)?.label || 'All Priorities';
  };

  const renderTaskCard = (task: Task) => (
    <div key={task.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all p-4 flex flex-col group">
      <div className="flex justify-between items-start mb-3 gap-2">
        <StatusBadge status={task.status} />
        <button 
          className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
          onClick={async () => {
            if(confirm('Are you sure you want to delete this task?')) {
              try {
                await deleteTask(task.id);
              } catch (error) {
                console.error('Failed to delete task:', error);
                alert('Failed to delete task. Please check API connection.');
              }
            }
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{task.title}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{task.description}</p>

      <div className="mt-auto pt-3 border-t border-gray-50 dark:border-slate-800/50 space-y-3">
        <div className="flex flex-col gap-2 text-xs font-medium">
          <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
            <Calendar className="w-3 h-3" />
            <span>{format(parseISO(task.dueDate), 'dd/MM/yyyy')}</span>
          </span>
          {task.dueAt && (
            <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3" />
              <span>{format(parseISO(task.dueAt), 'HH:mm')}</span>
            </span>
          )}
          <PriorityBadge priority={task.priority} showIcon={true} />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1.5 pt-1">
          {task.status !== 'in-progress' && task.status !== 'done' && (
            <button
              onClick={async () => {
                try {
                  await updateTask(task.id, { status: 'in-progress' });
                } catch (error) {
                  console.error('Failed to update task:', error);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-bold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors uppercase tracking-wider"
            >
              <PlayCircle className="w-3 h-3" />
              Progress
            </button>
          )}
          {task.status !== 'done' && (
            <button
              onClick={async () => {
                try {
                  await updateTask(task.id, { status: 'done' });
                } catch (error) {
                  console.error('Failed to update task:', error);
                }
              }}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-bold hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors uppercase tracking-wider"
            >
              <CheckCircle2 className="w-3 h-3" />
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Task Board</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Manage and track your daily tasks effectively.</p>
        </div>
        <Link to="/add" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2">
          <Plus className="w-4 h-4" /> 
          <span>Add New Task</span>
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none h-full w-4 text-gray-400" />
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-gray-400"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="relative w-full sm:w-48" ref={priorityDropdownRef}>
            <button
              onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
              className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2.5 w-full text-sm text-gray-700 dark:text-gray-300"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gray-400" />
                <span>{getSelectedPriorityLabel()}</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isPriorityDropdownOpen && (
              <div className="absolute top-full mt-2 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1">
                {priorityOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterPriority(option.value as any);
                      setIsPriorityDropdownOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300 flex items-center justify-between"
                  >
                    {option.label}
                    {filterPriority === option.value && <Check className="w-4 h-4 text-indigo-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => renderTaskCard(task))
        ) : (
          <div className="col-span-full py-12 text-center bg-gray-50/50 dark:bg-slate-800/10 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-800/50">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No tasks found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};
