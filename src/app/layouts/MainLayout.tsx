import React, { useState } from 'react';
import { Outlet } from 'react-router';
import { Sidebar } from '../components/Sidebar';
import { Header } from '../components/Header';
import { TaskProvider } from '../context/TaskContext';

export const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <TaskProvider>
      <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans transition-colors">
        <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <Header onMenuClick={toggleSidebar} />
          <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 p-6 transition-colors">
            <Outlet />
          </main>
        </div>
      </div>
    </TaskProvider>
  );
};