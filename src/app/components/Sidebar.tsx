import React from 'react';
import { NavLink } from 'react-router';
import { LayoutDashboard, CheckSquare, PlusCircle, Settings, LogOut, CheckSquare2, X, Calendar, Bell, Database } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const navItems = [
    { name: 'Tổng quan', path: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Công việc', path: '/tasks', icon: <CheckSquare className="w-5 h-5" /> },
    { name: 'Lịch', path: '/calendar', icon: <Calendar className="w-5 h-5" /> },
    { name: 'Thông báo', path: '/notifications', icon: <Bell className="w-5 h-5" /> },
    { name: 'Google Sheets', path: '/sheets', icon: <Database className="w-5 h-5" /> },
    { name: 'Thêm mới', path: '/add', icon: <PlusCircle className="w-5 h-5" /> },
  ];

  return (
    <>
      {/* Backdrop - chỉ hiển thị trên mobile khi sidebar mở */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed md:relative inset-y-0 left-0 z-50
        w-64 bg-white dark:bg-slate-900 border-r border-gray-100 dark:border-slate-800 
        h-full flex flex-col text-gray-800 dark:text-gray-200 transition-all duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 dark:border-slate-800 justify-between">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xl">
            <CheckSquare2 className="w-7 h-7" />
            <span>Taskify</span>
          </div>
          {/* Nút đóng - chỉ hiển thị trên mobile */}
          <button 
            onClick={onClose}
            className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-2">
          <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 px-2">Quản lý</div>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => onClose()} // Đóng sidebar khi click vào link trên mobile
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors font-medium ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-slate-800 space-y-2">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-100 w-full transition-colors font-medium text-left">
            <Settings className="w-5 h-5" />
            Cài đặt
          </button>
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 w-full transition-colors font-medium text-left">
            <LogOut className="w-5 h-5" />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};