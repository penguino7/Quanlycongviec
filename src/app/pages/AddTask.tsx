import React, { useState, useRef, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { useTasks, Task } from '../context/TaskContext';
import { ArrowLeft, Save, Calendar, Type, FileText, Flag, CheckCircle2, CalendarPlus, ChevronDown, Check } from 'lucide-react';
import { format, parse } from 'date-fns';
import DatePicker from 'react-datepicker';

type TaskFormInputs = Omit<Task, 'id' | 'createdAt'>;

export const AddTask = () => {
  const { addTask } = useTasks();
  const navigate = useNavigate();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm<TaskFormInputs>({
    defaultValues: {
      status: 'todo',
      priority: 'medium',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      dueDate: format(new Date(), 'yyyy-MM-dd'),
    }
  });

  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);
  const [isPriorityDropdownOpen, setIsPriorityDropdownOpen] = useState(false);
  const statusDropdownRef = useRef<HTMLDivElement>(null);
  const priorityDropdownRef = useRef<HTMLDivElement>(null);

  const selectedStatus = watch('status');
  const selectedPriority = watch('priority');

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

  const onSubmit = (data: TaskFormInputs) => {
    addTask(data);
    navigate('/tasks');
  };

  const statusOptions = [
    { value: 'todo', label: 'Cần làm' },
    { value: 'in-progress', label: 'Đang làm' },
    { value: 'done', label: 'Hoàn thành' },
  ];

  const priorityOptions = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
  ];

  const getStatusLabel = (value: string) => {
    return statusOptions.find(opt => opt.value === value)?.label || 'Cần làm';
  };

  const getPriorityLabel = (value: string) => {
    return priorityOptions.find(opt => opt.value === value)?.label || 'Trung bình';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Thêm công việc mới</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Điền thông tin chi tiết cho công việc mới của bạn.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden transition-colors">
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 md:p-8 space-y-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Type className="w-4 h-4 text-gray-400" />
                Tiêu đề công việc
              </label>
              <input
                id="title"
                type="text"
                className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 text-gray-900 dark:text-white transition-all outline-none ${errors.title ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-indigo-500'}`}
                placeholder="Nhập tiêu đề ngắn gọn..."
                {...register('title', { required: 'Vui lòng nhập tiêu đề công việc' })}
              />
              {errors.title && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.title.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 text-gray-400" />
                Mô tả chi tiết
              </label>
              <textarea
                id="description"
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none resize-none"
                placeholder="Mô tả cụ thể những gì cần hoàn thành..."
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  Trạng thái
                </label>
                <div className="relative" ref={statusDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none hover:bg-white dark:hover:bg-slate-700"
                  >
                    <span className="text-sm">{getStatusLabel(selectedStatus)}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isStatusDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1">
                      {statusOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setValue('status', option.value as any);
                            setIsStatusDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                            selectedStatus === option.value
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{option.label}</span>
                          {selectedStatus === option.value && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Flag className="w-4 h-4 text-gray-400" />
                  Độ ưu tiên
                </label>
                <div className="relative" ref={priorityDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsPriorityDropdownOpen(!isPriorityDropdownOpen)}
                    className="w-full flex items-center justify-between gap-2 px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none hover:bg-white dark:hover:bg-slate-700"
                  >
                    <span className="text-sm">{getPriorityLabel(selectedPriority)}</span>
                    <ChevronDown className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isPriorityDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isPriorityDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 py-1">
                      {priorityOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setValue('priority', option.value as any);
                            setIsPriorityDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                            selectedPriority === option.value
                              ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10'
                              : 'text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{option.label}</span>
                          {selectedPriority === option.value && (
                            <Check className="w-4 h-4" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <CalendarPlus className="w-4 h-4 text-gray-400" />
                  Ngày bắt đầu
                </label>
                <Controller
                  name="startDate"
                  control={control}
                  rules={{ required: 'Vui lòng chọn ngày bắt đầu' }}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : null}
                      onChange={(date) => {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Chọn ngày bắt đầu"
                      className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none cursor-pointer ${errors.startDate ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-indigo-500'}`}
                      wrapperClassName="w-full"
                      calendarClassName="shadow-xl"
                    />
                  )}
                />
                {errors.startDate && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.startDate.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Hạn chót
                </label>
                <Controller
                  name="dueDate"
                  control={control}
                  rules={{ required: 'Vui lòng chọn ngày đến hạn' }}
                  render={({ field }) => (
                    <DatePicker
                      selected={field.value ? parse(field.value, 'yyyy-MM-dd', new Date()) : null}
                      onChange={(date) => {
                        field.onChange(date ? format(date, 'yyyy-MM-dd') : '');
                      }}
                      dateFormat="dd/MM/yyyy"
                      placeholderText="Chọn hạn chót"
                      className={`w-full px-4 py-2.5 bg-gray-50 dark:bg-slate-800 border text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 focus:bg-white dark:focus:bg-slate-900 transition-all outline-none cursor-pointer ${errors.dueDate ? 'border-red-300 dark:border-red-500 focus:border-red-500' : 'border-gray-200 dark:border-slate-700 focus:border-indigo-500'}`}
                      wrapperClassName="w-full"
                      calendarClassName="shadow-xl"
                    />
                  )}
                />
                {errors.dueDate && <p className="mt-1.5 text-sm text-red-500 dark:text-red-400">{errors.dueDate.message}</p>}
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 dark:border-slate-800 flex justify-end gap-3 transition-colors">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:ring-2 focus:ring-gray-200 dark:focus:ring-slate-600 outline-none"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 outline-none flex items-center gap-2 shadow-sm"
            >
              <Save className="w-4 h-4" />
              Lưu công việc
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};