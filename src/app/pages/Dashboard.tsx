import React from 'react';
import { useTasks } from '../context/TaskContext';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, TrendingUp, Calendar, MoreHorizontal } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useTheme } from 'next-themes';
import { StatusBadge } from '../components/StatusBadge';

const COLORS = ['#10B981', '#F59E0B', '#EF4444'];

export const Dashboard = () => {
  const { tasks, updateTask } = useTasks();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
  };

  const pieData = [
    { name: 'Hoàn thành', value: stats.done },
    { name: 'Đang làm', value: stats.inProgress },
    { name: 'Cần làm', value: stats.todo },
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bảng điều khiển</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">Chào mừng trở lại! Dưới đây là tổng quan về công việc của bạn.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4" /> Báo cáo chi tiết
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Tổng số công việc" value={stats.total} icon={<Calendar className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />} color="text-indigo-600 dark:text-indigo-400" />
        <StatCard title="Hoàn thành" value={stats.done} icon={<CheckCircle2 className="w-6 h-6 text-emerald-500" />} color="text-emerald-500" />
        <StatCard title="Đang thực hiện" value={stats.inProgress} icon={<Clock className="w-6 h-6 text-amber-500" />} color="text-amber-500" />
        <StatCard title="Chưa bắt đầu" value={stats.todo} icon={<AlertCircle className="w-6 h-6 text-rose-500" />} color="text-rose-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 col-span-1 lg:col-span-2 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Thống kê trạng thái</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <XAxis dataKey="name" hide />
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
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-slate-800 transition-colors">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Tỷ lệ hoàn thành</h2>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={90}
                  paddingAngle={0}
                  dataKey="value"
                  stroke={isDark ? '#0f172a' : '#ffffff'}
                  strokeWidth={2}
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                    if (percent === 0) return null;
                    const RADIAN = Math.PI / 180;
                    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                    const x = cx + radius * Math.cos(-midAngle * RADIAN);
                    const y = cy + radius * Math.sin(-midAngle * RADIAN);
                    
                    return (
                      <text 
                        x={x} 
                        y={y} 
                        fill="white"
                        textAnchor="middle" 
                        dominantBaseline="central"
                        className="font-bold text-sm"
                      >
                        {`${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
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
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Công việc mới nhất</h2>
          <button className="text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors">Xem tất cả</button>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-800/50">
          {recentTasks.map(task => (
            <div key={task.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
              {/* Status indicator with 3 states */}
              <button
                onClick={() => {
                  const statusOrder = ['todo', 'in-progress', 'done'];
                  const currentIndex = statusOrder.indexOf(task.status);
                  const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length];
                  updateTask(task.id, { status: nextStatus as any });
                }}
                className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  task.status === 'done'
                    ? 'bg-emerald-500 border-emerald-500 dark:bg-emerald-600 dark:border-emerald-600'
                    : task.status === 'in-progress'
                    ? 'bg-amber-500 border-amber-500 dark:bg-amber-600 dark:border-amber-600'
                    : 'border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-500'
                }`}
                title={
                  task.status === 'todo' ? 'Click để chuyển sang: Đang làm' :
                  task.status === 'in-progress' ? 'Click để chuyển sang: Hoàn thành' :
                  'Click để chuyển sang: Cần làm'
                }
              >
                {task.status === 'done' && (
                  <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                )}
                {task.status === 'in-progress' && (
                  <Clock className="w-4 h-4 text-white" strokeWidth={3} />
                )}
              </button>

              <div className="flex flex-col flex-1 min-w-0">
                <span className={`font-medium transition-colors ${
                  task.status === 'done'
                    ? 'line-through text-gray-400 dark:text-gray-500'
                    : 'text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                }`}>
                  {task.title}
                </span>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(parseISO(task.createdAt), 'dd MMM yyyy', { locale: vi })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Đến hạn: {format(parseISO(task.dueDate), 'dd/MM/yyyy')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <StatusBadge status={task.status} />
              </div>
            </div>
          ))}
          {recentTasks.length === 0 && (
            <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
              Không có công việc nào.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};