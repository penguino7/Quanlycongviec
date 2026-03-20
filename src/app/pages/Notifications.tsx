import React, { useEffect, useMemo, useState } from "react";
import { Mail, MailOpen, Star, Trash2, Search, Clock } from "lucide-react";
import { isGasApiConfigured, notificationsApi } from "../services/gasApi";
import { NotificationDto } from "../services/types";

type Notification = NotificationDto;

const fallbackNotifications: Notification[] = [
  {
    id: "1",
    type: "task-assigned",
    subject: "New task assigned: Homepage UI",
    message:
      "You have been assigned a new task with high priority. Due date: 2026-03-20.",
    from: "Taskify System",
    timestamp: "2026-03-16T09:30:00Z",
    read: false,
    starred: true,
    priority: "high",
  },
  {
    id: "2",
    type: "task-completed",
    subject: "Task completed: Market research",
    message: "Task \"Market research\" has been marked as completed.",
    from: "Taskify System",
    timestamp: "2026-03-16T08:15:00Z",
    read: false,
    starred: false,
    priority: "normal",
  },
  {
    id: "3",
    type: "reminder",
    subject: "Reminder: Team meeting tomorrow",
    message:
      "Project team meeting starts at 10:00 AM tomorrow. Prepare your status update.",
    from: "Taskify System",
    timestamp: "2026-03-15T14:30:00Z",
    read: true,
    starred: false,
    priority: "normal",
  },
];

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(
    fallbackNotifications
  );
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(
    null
  );
  const [filter, setFilter] = useState<"all" | "unread" | "starred">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState<boolean>(isGasApiConfigured());

  const loadNotifications = async () => {
    if (!isGasApiConfigured()) return;

    setLoading(true);
    try {
      const pageSize = 200;
      let page = 1;
      let all: Notification[] = [];

      while (true) {
        const response = await notificationsApi.list({ page, pageSize });
        all = all.concat(response.items);
        if (response.items.length < pageSize) break;
        page += 1;
        if (page > 100) break;
      }

      setNotifications(all);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const getTypeIcon = (type: Notification["type"]) => {
    switch (type) {
      case "task-assigned":
        return "Task";
      case "task-completed":
        return "Done";
      case "task-overdue":
        return "Late";
      case "comment":
        return "Msg";
      case "reminder":
        return "Bell";
      default:
        return "Info";
    }
  };

  const getTypeColor = (type: Notification["type"]) => {
    switch (type) {
      case "task-assigned":
        return "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "task-completed":
        return "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400";
      case "task-overdue":
        return "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400";
      case "comment":
        return "bg-violet-100 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400";
      case "reminder":
        return "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400";
      default:
        return "bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hours ago`;
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString("vi-VN");
  };

  const updateLocalNotification = (
    id: string,
    updater: (item: Notification) => Notification
  ) => {
    setNotifications((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const toggleRead = async (id: string) => {
    const current = notifications.find((n) => n.id === id);
    if (!current) return;

    const nextRead = !current.read;
    updateLocalNotification(id, (item) => ({ ...item, read: nextRead }));

    if (!isGasApiConfigured()) return;

    try {
      const updated = await notificationsApi.markRead(id, nextRead);
      updateLocalNotification(id, () => updated);
    } catch (error) {
      console.error("Failed to update read status:", error);
      updateLocalNotification(id, (item) => ({ ...item, read: current.read }));
    }
  };

  const toggleStar = async (id: string) => {
    const current = notifications.find((n) => n.id === id);
    if (!current) return;

    const nextStarred = !current.starred;
    updateLocalNotification(id, (item) => ({ ...item, starred: nextStarred }));

    if (!isGasApiConfigured()) return;

    try {
      const updated = await notificationsApi.toggleStar(id);
      updateLocalNotification(id, () => updated);
    } catch (error) {
      console.error("Failed to toggle star:", error);
      updateLocalNotification(id, (item) => ({ ...item, starred: current.starred }));
    }
  };

  const deleteNotification = async (id: string) => {
    const previous = notifications;
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (selectedNotificationId === id) {
      setSelectedNotificationId(null);
    }

    if (!isGasApiConfigured()) return;

    try {
      await notificationsApi.delete(id);
    } catch (error) {
      console.error("Failed to delete notification:", error);
      setNotifications(previous);
    }
  };

  const markAllAsRead = async () => {
    const previous = notifications;
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    if (!isGasApiConfigured()) return;

    try {
      await notificationsApi.markAllRead();
      await loadNotifications();
    } catch (error) {
      console.error("Failed to mark all as read:", error);
      setNotifications(previous);
    }
  };

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (filter === "unread" && item.read) return false;
      if (filter === "starred" && !item.starred) return false;
      if (
        searchQuery &&
        !item.subject.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !item.message.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [notifications, filter, searchQuery]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const selectedNotification = notifications.find((n) => n.id === selectedNotificationId) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">You have {unreadCount} unread notifications</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
        >
          Mark all as read
        </button>
      </div>

      {loading && (
        <div className="text-sm text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-4 py-2 rounded-lg">
          Loading notifications from Apps Script API...
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "unread"
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter("starred")}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "starred"
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800"
                }`}
              >
                Starred
              </button>
            </div>
          </div>

          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications found</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    setSelectedNotificationId(notification.id);
                    if (!notification.read) {
                      toggleRead(notification.id);
                    }
                  }}
                  className={`p-4 border-b border-gray-100 dark:border-slate-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
                    selectedNotification?.id === notification.id ? "bg-indigo-50 dark:bg-indigo-500/5" : ""
                  } ${!notification.read ? "bg-blue-50/30 dark:bg-blue-500/5" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3
                          className={`text-sm font-semibold ${
                            !notification.read
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-700 dark:text-gray-300"
                          } line-clamp-2`}
                        >
                          {notification.subject}
                        </h3>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleStar(notification.id);
                          }}
                          className="flex-shrink-0"
                        >
                          <Star
                            className={`w-4 h-4 ${
                              notification.starred
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300 dark:text-gray-600"
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">{notification.from}</p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">{formatTimestamp(notification.timestamp)}</span>
                        {!notification.read && <span className="w-2 h-2 bg-blue-500 rounded-full"></span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
          {selectedNotification ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xs font-bold ${getTypeColor(selectedNotification.type)}`}>
                      {getTypeIcon(selectedNotification.type)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedNotification.subject}</h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">From: {selectedNotification.from}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleStar(selectedNotification.id)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        selectedNotification.starred
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                  <button
                    onClick={() => deleteNotification(selectedNotification.id)}
                    className="p-2 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimestamp(selectedNotification.timestamp)}</span>
                </div>
                {selectedNotification.priority === "high" && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                    High priority
                  </span>
                )}
              </div>

              <div className="prose dark:prose-invert max-w-none">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{selectedNotification.message}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <button
                  onClick={() => toggleRead(selectedNotification.id)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                >
                  {selectedNotification.read ? "Mark as unread" : "Mark as read"}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MailOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select a notification</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Choose a notification from the list to view details.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
