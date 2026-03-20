export type TaskStatus = "todo" | "in-progress" | "done" | "failed";
export type TaskPriority = "low" | "medium" | "high";

export type TaskDto = {
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

export type NotificationType =
  | "task-assigned"
  | "task-completed"
  | "task-overdue"
  | "comment"
  | "reminder";

export type NotificationDto = {
  id: string;
  type: NotificationType;
  subject: string;
  message: string;
  from: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  priority: "high" | "normal" | "low";
  relatedTaskId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type FinanceType = "income" | "expense";

export type FinanceDto = {
  id: string;
  date: string;
  category: string;
  type: FinanceType;
  amount: number;
  note: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CalendarEventDto = {
  id: string;
  title: string;
  description: string;
  location: string;
  startAt: string;
  endAt: string;
  allDay: boolean;
};
