import React, { useEffect, useState, useCallback } from 'react';
import { useTasks, Task } from '../context/TaskContext';
import { isSameDay, parseISO } from 'date-fns';
import { Bell, X, Volume2 } from 'lucide-react';

export const NotificationService = () => {
  const { tasks } = useTasks();
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Sound URL - A professional notification chime
  const NOTIFICATION_SOUND = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

  const playNotificationSound = useCallback(() => {
    const audio = new Audio(NOTIFICATION_SOUND);
    audio.play().catch(err => {
      console.log('Audio play failed (waiting for user interaction):', err);
    });
  }, []);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      }
    }
  };

  const showBrowserNotification = (task: Task) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Task Due Today!', {
        body: task.title,
        icon: '/favicon.ico'
      });
    }
  };

  useEffect(() => {
    const checkTasks = () => {
      const today = new Date();
      const dueToday = tasks.filter(task => {
        try {
          return task.status !== 'done' && isSameDay(parseISO(task.dueDate), today);
        } catch {
          return false;
        }
      });
      
      if (dueToday.length > 0 && dueToday.length !== todayTasks.length) {
        setTodayTasks(dueToday);
        setShowPopup(true);
        if (hasInteracted) {
          playNotificationSound();
          dueToday.forEach(showBrowserNotification);
        }
      }
    };

    // Check once on mount and when tasks change
    checkTasks();
  }, [tasks, hasInteracted, playNotificationSound, todayTasks.length]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        requestNotificationPermission();
        // Remove listener after first interaction
        window.removeEventListener('click', handleFirstInteraction);
      }
    };

    window.addEventListener('click', handleFirstInteraction);
    return () => window.removeEventListener('click', handleFirstInteraction);
  }, [hasInteracted]);

  if (!showPopup || todayTasks.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[100] animate-in slide-in-from-right-10 duration-500">
      <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-500/20 shadow-2xl rounded-2xl p-5 w-80 md:w-96 ring-1 ring-black/5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-lg text-white">
              <Bell className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">Today's Tasks!</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">You have {todayTasks.length} tasks due today</p>
            </div>
          </div>
          <button 
            onClick={() => setShowPopup(false)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2 max-h-48 overflow-y-auto mb-4 custom-scrollbar">
          {todayTasks.map(task => (
            <div key={task.id} className="p-3 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">{task.title}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 uppercase font-bold tracking-wider">{task.priority} Priority</p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => {
              setShowPopup(false);
              playNotificationSound();
            }}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-2"
          >
            <Volume2 className="w-4 h-4" /> Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
