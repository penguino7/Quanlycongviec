import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { isGasApiConfigured, tasksApi } from "../services/gasApi";
import { TaskDto, TaskPriority, TaskStatus } from "../services/types";

export type Task = {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  dueAt?: string;
  syncCalendar?: boolean;
  calendarEventId?: string;
  notified1hAt?: string;
  notified15mAt?: string;
  createdAt: string;
  updatedAt?: string;
};

type TaskInput = {
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string;
  dueDate: string;
  dueAt?: string;
  syncCalendar?: boolean;
};

type TaskContextType = {
  tasks: Task[];
  loading: boolean;
  addTask: (task: TaskInput) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  refreshTasks: () => Promise<void>;
};

const TaskContext = createContext<TaskContextType | undefined>(undefined);

const initialTasks: Task[] = [
  {
    id: "1",
    title: "Design homepage",
    description: "Create wireframe and UI draft for homepage.",
    status: "in-progress",
    priority: "high",
    startDate: "2026-03-16",
    dueDate: "2026-03-20",
    dueAt: "2026-03-20T17:00:00+07:00",
    syncCalendar: true,
    createdAt: "2026-03-16T10:00:00+07:00",
    updatedAt: "2026-03-16T10:00:00+07:00",
  },
  {
    id: "2",
    title: "Market research",
    description: "Analyze main competitors in target market.",
    status: "done",
    priority: "medium",
    startDate: "2026-03-10",
    dueDate: "2026-03-15",
    dueAt: "2026-03-15T17:00:00+07:00",
    syncCalendar: true,
    createdAt: "2026-03-10T09:00:00+07:00",
    updatedAt: "2026-03-15T18:00:00+07:00",
  },
  {
    id: "3",
    title: "Update API docs",
    description: "Add new endpoints to developer documentation.",
    status: "todo",
    priority: "low",
    startDate: "2026-03-18",
    dueDate: "2026-03-25",
    dueAt: "2026-03-25T17:00:00+07:00",
    syncCalendar: true,
    createdAt: "2026-03-16T11:30:00+07:00",
    updatedAt: "2026-03-16T11:30:00+07:00",
  },
];

const mapTaskDto = (task: TaskDto): Task => ({
  id: task.id,
  title: task.title,
  description: task.description || "",
  status: task.status,
  priority: task.priority,
  startDate: task.startDate,
  dueDate: task.dueDate,
  dueAt: task.dueAt,
  syncCalendar: task.syncCalendar,
  calendarEventId: task.calendarEventId,
  notified1hAt: task.notified1hAt,
  notified15mAt: task.notified15mAt,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

const sortByCreatedDesc = (tasks: Task[]) => {
  return [...tasks].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const TaskProvider = ({ children }: { children: ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [loading, setLoading] = useState<boolean>(isGasApiConfigured());

  const loadAllTasks = async () => {
    const pageSize = 200;
    let page = 1;
    let all: TaskDto[] = [];

    while (true) {
      const response = await tasksApi.list({ page, pageSize });
      all = all.concat(response.items);
      if (response.items.length < pageSize) break;
      page += 1;
      if (page > 100) break;
    }

    return all;
  };

  const refreshTasks = async () => {
    if (!isGasApiConfigured()) return;

    setLoading(true);
    try {
      const loaded = await loadAllTasks();
      const mapped = loaded.map(mapTaskDto);
      setTasks(sortByCreatedDesc(mapped));
    } catch (error) {
      console.error("Failed to load tasks from Apps Script API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  const addTask = async (task: TaskInput) => {
    if (!isGasApiConfigured()) {
      const newTask: Task = {
        ...task,
        id: Math.random().toString(36).slice(2, 11),
        dueAt: task.dueAt || `${task.dueDate}T17:00:00`,
        syncCalendar: task.syncCalendar !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      return;
    }

    try {
      const created = await tasksApi.create(task);
      setTasks((prev) => sortByCreatedDesc([mapTaskDto(created), ...prev]));
    } catch (error) {
      console.error("Failed to create task:", error);
      throw error;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    const previous = tasks;
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)));

    if (!isGasApiConfigured()) return;

    try {
      const updated = await tasksApi.update({ id, ...updates });
      setTasks((prev) => prev.map((task) => (task.id === id ? mapTaskDto(updated) : task)));
    } catch (error) {
      console.error("Failed to update task:", error);
      setTasks(previous);
      throw error;
    }
  };

  const deleteTask = async (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((task) => task.id !== id));

    if (!isGasApiConfigured()) return;

    try {
      await tasksApi.delete(id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      setTasks(previous);
      throw error;
    }
  };

  const value = useMemo(
    () => ({
      tasks,
      loading,
      addTask,
      updateTask,
      deleteTask,
      refreshTasks,
    }),
    [tasks, loading]
  );

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider");
  }
  return context;
};
