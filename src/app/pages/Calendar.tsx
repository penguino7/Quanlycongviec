import React, { useEffect, useState } from 'react';
import { Calendar as CalendarIcon, Clock, AlertCircle, BookOpen } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import {
  format,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  parseISO,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { calendarApi, isGasApiConfigured } from '../services/gasApi';
import { CalendarEventDto } from '../services/types';

const toMonthRange = (date: Date) => {
  const from = format(startOfMonth(date), 'yyyy-MM-dd') + 'T00:00:00';
  const to = format(endOfMonth(date), 'yyyy-MM-dd') + 'T23:59:59';
  return { from, to };
};

const formatEventTime = (event: CalendarEventDto) => {
  if (event.allDay) return 'All day';

  try {
    return `${format(parseISO(event.startAt), 'HH:mm')} - ${format(parseISO(event.endAt), 'HH:mm')}`;
  } catch {
    return 'Time unavailable';
  }
};

export const Calendar = () => {
  const { tasks } = useTasks();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [externalEvents, setExternalEvents] = useState<CalendarEventDto[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(isGasApiConfigured());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDay = monthStart.getDay();
  const previousMonthDays = Array.from({ length: startDay }, (_, i) => {
    const date = new Date(monthStart);
    date.setDate(date.getDate() - (startDay - i));
    return date;
  });

  const totalCells = [...previousMonthDays, ...daysInMonth].length;
  const nextMonthDays = Array.from({ length: 42 - totalCells }, (_, i) => {
    const date = new Date(monthEnd);
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays];

  useEffect(() => {
    const loadExternalEvents = async () => {
      if (!isGasApiConfigured()) {
        setExternalEvents([]);
        return;
      }

      setLoadingEvents(true);
      try {
        const range = toMonthRange(currentMonth);
        const response = await calendarApi.events(range);
        setExternalEvents(response.items);
      } catch (error) {
        console.error('Failed to load Google Calendar events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };

    loadExternalEvents();
  }, [currentMonth]);

  const getTasksForDate = (date: Date) => {
    return tasks.filter((task) => {
      try {
        const base = task.dueAt || task.dueDate;
        return isSameDay(parseISO(base), date);
      } catch {
        return false;
      }
    });
  };

  const getExternalEventsForDate = (date: Date) => {
    return externalEvents.filter((event) => {
      try {
        return isSameDay(parseISO(event.startAt), date);
      } catch {
        return false;
      }
    });
  };

  const selectedDateTasks = getTasksForDate(selectedDate);
  const selectedDateEvents = getExternalEventsForDate(selectedDate);

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

  const noData = selectedDateTasks.length === 0 && selectedDateEvents.length === 0;

  return (
    <div className="h-full flex items-center justify-center overflow-hidden p-3 md:p-4 lg:p-6">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-3 md:p-4 lg:p-6 max-h-[calc(100vh-140px)] md:max-h-[650px] flex flex-col">
            <div className="flex items-center justify-between mb-3 md:mb-4 lg:mb-6 flex-shrink-0">
              <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white flex flex-col sm:flex-row sm:items-center gap-0 sm:gap-2">
                <span className="capitalize">{format(currentMonth, 'MMMM', { locale: enUS })}</span>
                <span className="text-gray-500 dark:text-gray-400 font-normal text-base md:text-xl">{format(currentMonth, 'yyyy')}</span>
              </h2>
              <div className="flex gap-1.5 md:gap-2">
                <button
                  onClick={goToPreviousMonth}
                  className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                >
                  {'<'}
                </button>
                <button
                  onClick={goToToday}
                  className="px-2 md:px-3 py-1.5 md:py-2 text-xs lg:text-sm bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium border-0"
                >
                  Today
                </button>
                <button
                  onClick={goToNextMonth}
                  className="p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-gray-600 dark:text-gray-400"
                >
                  {'>'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5 md:gap-1 lg:gap-2 mb-1.5 md:mb-2 flex-shrink-0">
              {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                <div
                  key={day}
                  className="text-center text-[10px] md:text-xs font-bold text-gray-400 dark:text-gray-500 py-1.5 md:py-2 uppercase tracking-wide"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-0.5 md:gap-1 lg:gap-2 flex-1 content-start">
              {allDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isTodayDate = isToday(day);
                const isSelected = isSameDay(day, selectedDate);
                const hasTasks = getTasksForDate(day).length > 0;
                const hasExternalEvents = getExternalEventsForDate(day).length > 0;

                return (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedDate(day);
                      if (!isSameMonth(day, currentMonth)) {
                        setCurrentMonth(day);
                      }
                    }}
                    className={`
                      relative h-10 sm:h-12 lg:h-14 w-full rounded-md md:rounded-lg text-xs md:text-sm font-medium transition-all flex items-center justify-center border-0
                      ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-900 dark:text-gray-100'}
                      ${isSelected ? 'bg-indigo-600 text-white dark:bg-indigo-500' : 'hover:bg-gray-100 dark:hover:bg-slate-800'}
                      ${isTodayDate && !isSelected ? 'ring-2 ring-indigo-600 dark:ring-indigo-400' : ''}
                    `}
                  >
                    <span className="block">{format(day, 'd')}</span>
                    {hasTasks && (
                      <span className={`absolute bottom-0.5 md:bottom-1 left-[45%] transform -translate-x-1/2 w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white' : 'bg-indigo-600 dark:bg-indigo-400'
                      }`} />
                    )}
                    {hasExternalEvents && (
                      <span className={`absolute bottom-0.5 md:bottom-1 left-[55%] transform -translate-x-1/2 w-1 h-1 rounded-full ${
                        isSelected ? 'bg-white/70' : 'bg-emerald-500'
                      }`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-3 md:p-4 lg:p-6 flex flex-col max-h-[400px] md:max-h-[500px] lg:max-h-[600px]">
            <div className="flex items-center gap-2 mb-3 md:mb-4 flex-shrink-0">
              <CalendarIcon className="w-4 h-4 md:w-5 md:h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-gray-900 dark:text-white text-sm md:text-base">
                {format(selectedDate, 'dd MMMM yyyy', { locale: enUS })}
              </h3>
            </div>

            {loadingEvents && isGasApiConfigured() && (
              <p className="text-[11px] text-indigo-600 dark:text-indigo-400 mb-3">
                Loading Google Calendar events...
              </p>
            )}

            {noData ? (
              <div className="text-center py-6 md:py-8 flex-1 flex items-center justify-center">
                <div>
                  <AlertCircle className="w-10 h-10 md:w-12 md:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 md:mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 text-xs md:text-sm px-4">
                    No schedule for this date
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3 overflow-y-auto flex-1 pr-1 custom-scrollbar">
                {selectedDateTasks.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                      Tasks
                    </p>
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
                        <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs mb-2 md:mb-3 line-clamp-2 leading-relaxed">
                          {task.description}
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <PriorityBadge priority={task.priority} showIcon={false} className="bg-gray-50 dark:bg-gray-800/50 px-2 py-0.5 rounded-full border border-gray-100 dark:border-slate-700" />
                          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 text-[10px]">
                            <Clock className="w-3 h-3" />
                            {task.dueAt ? format(parseISO(task.dueAt), 'HH:mm') : '--:--'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {selectedDateEvents.length > 0 && (
                  <div className="space-y-2.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      Google Calendar
                    </p>
                    {selectedDateEvents.map((event) => (
                      <div
                        key={event.id}
                        className="p-3 md:p-4 rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-500/5"
                      >
                        <div className="flex items-start justify-between mb-1.5 md:mb-2 gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-xs md:text-sm line-clamp-1">
                            {event.title}
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                            Event
                          </span>
                        </div>
                        {event.description && (
                          <p className="text-gray-600 dark:text-gray-400 text-[10px] md:text-xs mb-2 md:mb-3 line-clamp-2 leading-relaxed">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="w-3 h-3" />
                            {formatEventTime(event)}
                          </div>
                          {event.location && (
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <BookOpen className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{event.location}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
