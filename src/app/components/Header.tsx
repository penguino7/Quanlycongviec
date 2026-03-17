import React from 'react';
import { Bell, Search, Menu, Sun, Moon, Mail, Clock, TrendingUp } from 'lucide-react';
import { useTheme } from "next-themes";
import { useTasks } from '../context/TaskContext';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { setTheme, theme } = useTheme();
  const { tasks } = useTasks();

  // Calculate completion percentage
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Calculate working hours (from 8:00 AM to current time, max 8 hours)
  const currentHour = new Date().getHours();
  const currentMinutes = new Date().getMinutes();
  const startHour = 8; // 8 AM
  let workingHours = 0;
  
  if (currentHour >= startHour) {
    workingHours = currentHour - startHour + (currentMinutes / 60);
    workingHours = Math.min(workingHours, 8); // Max 8 hours
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-6 sticky top-0 z-10 w-full transition-colors">
      <div className="flex items-center gap-4 flex-1">
        <button 
          onClick={onMenuClick}
          className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition duration-150 ease-in-out"
            placeholder="Tìm kiếm công việc nhanh..."
          />
        </div>
      </div>
      
      <div className="flex items-center gap-5">
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute top-2 left-2 h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
        <button className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 relative transition-colors p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900"></span>
        </button>
        <div className="flex items-center gap-3 ml-2">
          <img
            className="h-9 w-9 rounded-full object-cover ring-2 ring-gray-100 dark:ring-slate-800"
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
            alt="User avatar"
          />
          <div className="hidden lg:block text-sm">
            <p className="font-semibold text-gray-700 dark:text-gray-200">Nguyễn Văn A</p>
            <div className="flex items-center gap-3 mt-0.5">
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                <Mail className="h-3 w-3" />
                <span>nguyenvana@email.com</span>
              </div>
              <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400 text-xs">
                <Clock className="h-3 w-3" />
                <span>{workingHours.toFixed(1)}h</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className={`font-medium ${
                  completionPercentage >= 70 
                    ? 'text-green-600 dark:text-green-400' 
                    : completionPercentage >= 40 
                    ? 'text-yellow-600 dark:text-yellow-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {completionPercentage}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};