import React from 'react';
import { useTasks } from '../context/TaskContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, XCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTheme } from 'next-themes';
import { StatusBadge } from '../components/StatusBadge';

const COLORS = ['#10B981', '#F59E0B', '#64748b', '#EF4444'];

export const Dashboard = () => {
  const { tasks } = useTasks();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    failed: tasks.filter(t => t.status === 'failed').length,
  };

  const chartData = [
    { name: 'Done', value: stats.done },
    { name: 'In Progress', value: stats.inProgress },
    { name: 'Todo', value: stats.todo },
    { name: 'Overdue', value: stats.failed },
  ];

  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const StatCard = ({ title, value, icon, color }: any) => (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm p-6 flex items-center justify-between border border-gray-100 dark:border-slate-800 transition-all hover:shadow-md">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
      <div className={`p-4 rounded-full bg-opacity-10 dark:bg-opacity-20 ${color.replace('text', 'bg')}`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Welcome back! Here's an overview of your productivity.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Reports
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="Total Tasks" value={stats.total} icon={<Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />} color="text-indigo-600 dark:text-indigo-400" />
        <StatCard title="Done" value={stats.done} icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />} color="text-emerald-500" />
        <StatCard title="In Progress" value={stats.inProgress} icon={<Clock className="w-6 h-6 text-amber-500" />} color="text-amber-500" />
        <StatCard title="Todo" value={stats.todo} icon={<AlertCircle className="w-6 h-6 text-slate-500" />} color="text-slate-500" />
        <StatCard title="Overdue" value={stats.failed} icon={<XCircle className="w-6 h-6 text-rose-500" />} color="text-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 col-span-1 lg:col-span-2 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Task Distribution</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" stroke={isDark ? '#94a3b8' : '#64748b'} tick={{ fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip 
                  cursor={{ fill: isDark ? '#334155' : '#f1f5f9' }} 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Task Ratios</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={80}
                  paddingAngle={0}
                  dataKey="value"
                  stroke={isDark ? '#0f172a' : '#ffffff'}
                  strokeWidth={2}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                  }} 
                />
                <Legend iconType="circle" wrapperStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 mt-8 transition-colors">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Recent Tasks</h2>
          <Link to="/tasks" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">View All</Link>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
          {recentTasks.map(task => (
            <div key={task.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
              <div className="flex flex-col flex-1 min-w-0">
                <span className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                  {task.title}
                </span>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Due: {format(parseISO(task.dueDate), 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>
              <StatusBadge status={task.status} />
            </div>
          ))}
          {recentTasks.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              No tasks found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};