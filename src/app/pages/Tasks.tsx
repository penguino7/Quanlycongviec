import React, { useState, useRef, useEffect } from 'react';
import { useTasks, Task } from '../context/TaskContext';
import { Search, Filter, Plus, Edit2, Trash2, Calendar, Clock, AlertTriangle, ChevronDown, Check } from 'lucide-react';
import { Link } from 'react-router';
import { format, parseISO } from 'date-fns';

export const Tasks = () => {
  const { tasks, updateTask, deleteTask } = useTasks();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Task['status'] | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Task['priority'] | 'all'>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusDropdownRef.current && !statusDropdownRef.current.contains(event.target as Node)) {
        setIsStatusDropdownOpen(false);
      }
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
    const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: Task['status']) => {
    switch(status) {
      case 'done': return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20';
      case 'in-progress': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20';
      case 'todo': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch(priority) {
      case 'high': return 'text-rose-600 dark:text-rose-400';
      case 'medium': return 'text-amber-500 dark:text-amber-400';
      case 'low': return 'text-emerald-500 dark:text-emerald-400';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch(status) {
      case 'done': return 'Hoàn thành';
      case 'in-progress': return 'Đang làm';
      case 'todo': return 'Cần làm';
    }
  };

  const statusOptions = [
    { value: 'all', label: 'Tất cả trạng thái' },
    { value: 'todo', label: 'Cần làm' },
    { value: 'in-progress', label: 'Đang làm' },
    { value: 'done', label: 'Hoàn thành' },
  ];

  const priorityOptions = [
    { value: 'all', label: 'Mọi mức độ' },
    { value: 'high', label: 'Cao' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'low', label: 'Thấp' },
  ];

  const getSelectedStatusLabel = () => {
    return statusOptions.find(opt => opt.value === filterStatus)?.label || 'Tất cả trạng thái';
  };

  const getSelectedPriorityLabel = () => {
    return priorityOptions.find(opt => opt.value === filterPriority)?.label || 'Mọi mức độ';
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Section - Responsive */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Danh sách công việc</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-xs sm:text-sm">Quản lý và theo dõi tất cả các công việc của bạn.</p>
        </div>
        <Link to="/add" className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" /> 
          <span>Thêm công việc mới</span>
        </Link>
      </div>

      {/* Filter Bar - Responsive */}
      <div className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
        <div className="flex flex-col gap-3">
          {/* Search Input */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 sm:py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg text-xs sm:text-sm bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
              placeholder="Tìm kiếm theo tiêu đề hoặc mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Dropdowns */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {/* Status Dropdown */}
            <div className="relative flex-1" ref={statusDropdownRef}>
              <button
                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 sm:py-2.5 w-full transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                    {getSelectedStatusLabel()}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isStatusDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 sm:right-auto sm:w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterStatus(option.value as any);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                        filterStatus === option.value
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{option.label}</span>
                      {filterStatus === option.value && (
                        <Check className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Dropdown */}
            <div className="relative flex-1" ref={priorityDropdownRef}>
              <button
                onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                className="flex items-center justify-between gap-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 sm:py-2.5 w-full transition-colors hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <AlertTriangle className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">
                    {getSelectedPriorityLabel()}
                  </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform flex-shrink-0 ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isPriorityDropdownOpen && (
                <div className="absolute top-full mt-2 left-0 right-0 sm:right-auto sm:w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1">
                  {priorityOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setFilterPriority(option.value as any);
                        setIsPriorityDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs sm:text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                        filterPriority === option.value
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{option.label}</span>
                      {filterPriority === option.value && (
                        <Check className="w-4 h-4 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Task Cards Grid - Responsive */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
        {filteredTasks.length > 0 ? filteredTasks.map(task => (
          <div key={task.id} className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 hover:shadow-md transition-all p-4 sm:p-5 flex flex-col group">
            {/* Card Header */}
            <div className="flex justify-between items-start mb-3 gap-2">
              <span className={`px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusColor(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>
              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button 
                  className="p-1.5 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-md transition-colors"
                  onClick={() => {
                    const nextStatus = task.status === 'todo' ? 'in-progress' : task.status === 'in-progress' ? 'done' : 'todo';
                    updateTask(task.id, { status: nextStatus });
                  }}
                  title="Chuyển trạng thái"
                >
                  <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button 
                  className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors"
                  onClick={() => {
                    if(confirm('Bạn có chắc chắn muốn xóa công việc này?')) {
                      deleteTask(task.id);
                    }
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Card Content */}
            <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{task.title}</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 flex-1">{task.description}</p>

            {/* Card Footer */}
            <div className="mt-auto pt-3 sm:pt-4 border-t border-gray-50 dark:border-slate-800/50">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between text-xs font-medium">
                <span className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800 px-2 py-1 rounded-md transition-colors w-fit">
                  <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="text-xs">{format(parseISO(task.dueDate), 'dd/MM/yyyy')}</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400 dark:text-gray-500 text-xs">Ưu tiên:</span>
                  <span className={`flex items-center gap-1 ${getPriorityColor(task.priority)}`}>
                    <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    <span className="text-xs">{task.priority === 'high' ? 'Cao' : task.priority === 'medium' ? 'Trung bình' : 'Thấp'}</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-12 sm:py-16 px-4 text-center bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-800 border-dashed transition-colors">
            <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 mb-4">
              <Search className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-1">Không tìm thấy công việc nào</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">Thử thay đổi bộ lọc hoặc thêm công việc mới.</p>
            <Link to="/add" className="inline-flex items-center gap-2 text-xs sm:text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 px-4 py-2 rounded-lg transition-colors">
              <Plus className="w-4 h-4" /> Thêm công việc mới
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};