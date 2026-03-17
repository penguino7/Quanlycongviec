import React, { createContext, useContext, useState, ReactNode } from 'react';

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  startDate: string;
  dueDate: string;
  createdAt: string;
};

type TaskContextType = {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Thiết kế giao diện trang chủ',
    description: 'Tạo wireframe và mockup cho trang chủ theo yêu cầu mới.',
    status: 'in-progress',
    priority: 'high',
    startDate: '2026-03-16',
    dueDate: '2026-03-20',
    createdAt: '2026-03-16T10:00:00Z',
  },
  {
    id: '2',
    title: 'Nghiên cứu thị trường',
    description: 'Phân tích các đối thủ cạnh tranh chính trong ngành.',
    status: 'done',
    priority: 'medium',
    startDate: '2026-03-10',
    dueDate: '2026-03-15',
    createdAt: '2026-03-10T09:00:00Z',
  },
  {
    id: '3',
    title: 'Cập nhật tài liệu API',
    description: 'Bổ sung các endpoint mới vào tài liệu dành cho developer.',
    status: 'todo',
    priority: 'low',
    startDate: '2026-03-18',
    dueDate: '2026-03-25',
    createdAt: '2026-03-16T11:30:00Z',
  },
];

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addTask = (task: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...task,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
    };
    setTasks([newTask, ...tasks]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
  };

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error('useTasks must be used within a TaskProvider');
  }
  return context;
};