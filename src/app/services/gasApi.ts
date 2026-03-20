import { CalendarEventDto, FinanceDto, NotificationDto, TaskDto } from "./types";

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: {
    status: number;
    code: string;
    message: string;
  } | null;
  meta: Record<string, unknown>;
};

type RequestMethod = "GET" | "POST";

type RequestOptions = {
  method?: RequestMethod;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: Record<string, unknown>;
  signal?: AbortSignal;
};

const GAS_WEB_APP_URL = String(import.meta.env.VITE_GAS_WEB_APP_URL || "").trim();
const GAS_API_TOKEN = String(import.meta.env.VITE_GAS_API_TOKEN || "").trim();

export class GasApiError extends Error {
  status?: number;
  code?: string;

  constructor(message: string, status?: number, code?: string) {
    super(message);
    this.name = "GasApiError";
    this.status = status;
    this.code = code;
  }
}

export const isGasApiConfigured = () => Boolean(GAS_WEB_APP_URL);

function requireBaseUrl() {
  if (!GAS_WEB_APP_URL) {
    throw new GasApiError(
      "Missing VITE_GAS_WEB_APP_URL. Please configure Apps Script Web App URL."
    );
  }
}

async function request<T>(action: string, options: RequestOptions = {}): Promise<T> {
  requireBaseUrl();

  const method = options.method || "GET";
  const query = options.query || {};
  const body = options.body || {};

  const response = await fetch(GAS_WEB_APP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain;charset=utf-8",
    },
    body: JSON.stringify({
      action,
      token: GAS_API_TOKEN || undefined,
      query,
      payload: method === "GET" ? {} : body,
    }),
    signal: options.signal,
  });

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new GasApiError(`HTTP ${response.status}`, response.status, "HTTP_ERROR");
  }

  const json = (await response.json()) as ApiEnvelope<T>;
  if (!json.success) {
    throw new GasApiError(
      json.error?.message || "Apps Script API error",
      json.error?.status,
      json.error?.code
    );
  }

  return json.data;
}

type ListResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
};

export const tasksApi = {
  list: (query?: {
    search?: string;
    status?: string;
    priority?: string;
    dueFrom?: string;
    dueTo?: string;
    page?: number;
    pageSize?: number;
  }) =>
    request<ListResponse<TaskDto>>("tasks.list", {
      method: "GET",
      query,
    }),

  create: (payload: Omit<TaskDto, "id" | "createdAt" | "updatedAt">) =>
    request<TaskDto>("tasks.create", {
      method: "POST",
      body: payload,
    }),

  update: (payload: Partial<TaskDto> & { id: string }) =>
    request<TaskDto>("tasks.update", {
      method: "POST",
      body: payload,
    }),

  delete: (id: string) =>
    request<{ success: boolean; id: string }>("tasks.delete", {
      method: "POST",
      body: { id },
    }),

  stats: (query?: { dueFrom?: string; dueTo?: string }) =>
    request<{
      total: number;
      done: number;
      inProgress: number;
      todo: number;
      failed: number;
    }>("tasks.stats", { method: "GET", query }),

  recent: (limit = 5) =>
    request<{ items: TaskDto[] }>("tasks.recent", {
      method: "GET",
      query: { limit },
    }),

  byDate: (date: string) =>
    request<{ date: string; items: TaskDto[] }>("tasks.byDate", {
      method: "GET",
      query: { date },
    }),

  dueToday: () =>
    request<{ date: string; items: TaskDto[] }>("tasks.dueToday", {
      method: "GET",
    }),
};

export const notificationsApi = {
  list: (query?: {
    filter?: "all" | "unread" | "starred";
    search?: string;
    page?: number;
    pageSize?: number;
  }) =>
    request<
      ListResponse<NotificationDto> & {
        unreadCount: number;
      }
    >("notifications.list", {
      method: "GET",
      query,
    }),

  create: (
    payload: Omit<NotificationDto, "id" | "createdAt" | "updatedAt" | "timestamp"> & {
      timestamp?: string;
    }
  ) =>
    request<NotificationDto>("notifications.create", {
      method: "POST",
      body: payload,
    }),

  markRead: (id: string, read: boolean) =>
    request<NotificationDto>("notifications.markRead", {
      method: "POST",
      body: { id, read },
    }),

  toggleStar: (id: string) =>
    request<NotificationDto>("notifications.toggleStar", {
      method: "POST",
      body: { id },
    }),

  delete: (id: string) =>
    request<{ success: boolean; id: string }>("notifications.delete", {
      method: "POST",
      body: { id },
    }),

  markAllRead: () =>
    request<{ updatedCount: number }>("notifications.markAllRead", {
      method: "POST",
      body: {},
    }),
};

export const financeApi = {
  list: (query?: {
    type?: "all" | "income" | "expense";
    search?: string;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }) =>
    request<ListResponse<FinanceDto>>("finance.list", {
      method: "GET",
      query,
    }),

  create: (payload: Omit<FinanceDto, "id" | "createdAt" | "updatedAt">) =>
    request<FinanceDto>("finance.create", {
      method: "POST",
      body: payload,
    }),

  summary: (query?: { from?: string; to?: string }) =>
    request<{
      totalIncome: number;
      totalExpense: number;
      balance: number;
      topCategory: string;
      topAmount: number;
    }>("finance.summary", {
      method: "GET",
      query,
    }),

  byCategory: (query?: { from?: string; to?: string }) =>
    request<{ items: Array<{ name: string; value: number }> }>(
      "finance.byCategory",
      {
        method: "GET",
        query,
      }
    ),
};

export const sheetsApi = {
  list: () =>
    request<{ sheetNames: string[] }>("sheets.list", {
      method: "GET",
    }),

  headers: (sheetName: string) =>
    request<{ headers: string[]; sheetName: string }>("sheets.headers", {
      method: "GET",
      query: { sheetName },
    }),

  append: (payload: { sheetName: string; rowData: Record<string, unknown> }) =>
    request<{ success: boolean; sheetName: string; rowNumber: number }>(
      "sheets.append",
      {
        method: "POST",
        body: payload,
      }
    ),

  create: (payload: { sheetName: string; headers: string[] }) =>
    request<{ success: boolean; sheetName: string; headers: string[] }>(
      "sheets.create",
      {
        method: "POST",
        body: payload,
      }
    ),
};

export const systemApi = {
  health: () =>
    request<{
      status: string;
      version: string;
      timestamp: string;
      timezone: string;
    }>("system.health", { method: "GET" }),
  runReminderSweep: () =>
    request<{
      reminded1h: number;
      reminded15m: number;
      autoFailed: number;
      checkedAt: string;
    }>("system.runReminderSweep", { method: "POST", body: {} }),
  setupReminderTrigger: (intervalMinutes = 5) =>
    request<{
      success: boolean;
      triggerId: string;
      intervalMinutes: number;
    }>("system.setupReminderTrigger", {
      method: "POST",
      body: { intervalMinutes },
    }),
  clearReminderTrigger: () =>
    request<{ success: boolean; removed: number }>("system.clearReminderTrigger", {
      method: "POST",
      body: {},
    }),
};

export const calendarApi = {
  events: (query: { from: string; to: string }) =>
    request<{
      from: string;
      to: string;
      items: CalendarEventDto[];
    }>("calendar.events", {
      method: "GET",
      query,
    }),
};
