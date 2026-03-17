import React, { useState } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';

export const Calendar = () => {
  const { tasks } = useTasks();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // Lấy tất cả các ngày trong tháng hiện tại
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Lấy các ngày từ tháng trước để fill vào calendar
  const startDay = monthStart.getDay();
  const previousMonthDays = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  // Lấy các ngày từ tháng sau
  const totalCells = [...previousMonthDays, ...daysInMonth].length;
  const nextMonthDays = Array.from({ length: 42 - totalCells }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays];

  // Lấy công việc cho một ngày cụ thể
  const getTasksForDate = (date: Date) => {
    return tasks.filter(task => {
      try {
        return isSameDay(parseISO(task.dueDate), date);
      } catch {
        return false;
      }
    });
  };

  // Kiểm tra xem ngày có công việc không
  const hasTasksOnDate = (date: Date) => {
    return getTasksForDate(date).length > 0;
  };

  const selectedDateTasks = getTasksForDate(selectedDate);



  const goToPreviousMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() - 1);
    setCurrentMonth(newMonth);
  };

  const goToNextMonth = () => {
    const newMonth = new Date(currentMonth);
    newMonth.setMonth(newMonth.getMonth() + 1);
    setCurrentMonth(newMonth);
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  return (
    <div className="h-full flex items-center justify-center overflow-hidden p-3 md:p-4 lg:p-6">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-3 md:p-4 lg:p-6 max-h-[calc(100vh-140px)] md:max-h-[650px] flex flex-col">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6 flex-shrink-0">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                <span className="capitalize">{format(currentMonth, 'MMMM', { locale: vi })}</span>
                <span className="text-gray-500 dark:text-gray-400 font-normal text-base md:text-xl">{format(currentMonth, 'yyyy')}</span>
              </h2>
              <div className="flex gap-1.5 md:gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                >
                  ←
                </button>
                <button
                  onClick={goToToday}
                  className="px-2 md:px-3 py-1.5 md:py-2 text-xs lg:text-sm bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
                >
                  Hôm nay
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                >
                  →
                </button>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1 lg:gap-2 mb-1.5 md:mb-2 flex-shrink-0">
              {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs md:text-sm font-semibold text-gray-500 dark:text-gray-400 py-1.5 md:py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-0.5 md:gap-1 lg:gap-2 flex-1 content-start">
              {allDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const isSelected = isSameDay(day, selectedDate);
                const hasTasks = hasTasksOnDate(day);

                return (
                  <button
                    key={index}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative h-10 sm:h-12 lg:h-14 w-full rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-all flex items-center justify-center
                      ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-900 dark:text-gray-100'}
                      ${isSelected ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}
                      ${isTodayDate && !isSelected ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''}
                    `}
                  >
                    <span className="block">{format(day, 'd')}</span>
                    {hasTasks && (
                      <span className={`absolute bottom-0.5 md:bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-indigo-600 dark:bg-indigo-400'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

           {/* Selected Date Tasks */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-3 md:p-4 lg:p-6 flex flex-col max-h-[400px] md:max-h-[500px] lg:max-h-[600px]">
            <div className="flex items-center gap-2 mb-3 md:mb-4 flex-shrink-0">
              <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                {format(selectedDate, 'dd MMMM yyyy', { locale: vi })}
              </h3>
            </div>

             {selectedDateTasks.length === 0 ? (
              <div className="text-center py-6 md:py-8 flex-1 flex items-center justify-center">
                <div>
                  <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 md:mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm">
                    Không có công việc nào trong ngày này
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5 md:space-y-3 overflow-y-auto flex-1">
                {selectedDateTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 md:p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1.5 md:mb-2 gap-2">
                      <h4 className="font-semibold text-gray-900 dark:text-white text-xs md:text-sm line-clamp-1">
                        {task.title}
                      </h4>
                      <StatusBadge status={task.status} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-2 md:mb-3 line-clamp-2">
                      {task.description}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <PriorityBadge priority={task.priority} showIcon={false} className="bg-gray-50 dark:bg-gray-500/10 px-2 py-1 rounded-full" />
                      <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                        <Clock className="w-3 h-3" />
                        {format(parseISO(task.dueDate), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};