import React, { useState } from 'react';
import { Mail, MailOpen, Star, Archive, Trash2, Search, Filter, Clock, AlertCircle } from 'lucide-react';

type NotificationType = 'task-assigned' | 'task-completed' | 'task-overdue' | 'comment' | 'reminder';

type Notification = {
  id: string;
  type: NotificationType;
  subject: string;
  message: string;
  from: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  priority: 'high' | 'normal' | 'low';
};

const initialNotifications: Notification[] = [
  {
    id: '1',
    type: 'task-assigned',
    subject: 'Công việc mới được giao: Thiết kế giao diện trang chủ',
    message: 'Bạn đã được giao một công việc mới "Thiết kế giao diện trang chủ" với độ ưu tiên cao. Hạn hoàn thành: 20/03/2026.',
    from: 'Hệ thống Taskify',
    timestamp: '2026-03-16T09:30:00Z',
    read: false,
    starred: true,
    priority: 'high',
  },
  {
    id: '2',
    type: 'task-completed',
    subject: 'Công việc đã hoàn thành: Nghiên cứu thị trường',
    message: 'Công việc "Nghiên cứu thị trường" đã được đánh dấu hoàn thành bởi Nguyễn Văn B.',
    from: 'Nguyễn Văn B',
    timestamp: '2026-03-16T08:15:00Z',
    read: false,
    starred: false,
    priority: 'normal',
  },
  {
    id: '3',
    type: 'task-overdue',
    subject: 'Cảnh báo: Công việc sắp quá hạn',
    message: 'Công việc "Cập nhật tài liệu API" sẽ đến hạn trong 2 ngày nữa. Vui lòng kiểm tra và hoàn thành đúng tiến độ.',
    from: 'Hệ thống Taskify',
    timestamp: '2026-03-16T07:00:00Z',
    read: true,
    starred: false,
    priority: 'high',
  },
  {
    id: '4',
    type: 'comment',
    subject: 'Bình luận mới về công việc của bạn',
    message: 'Trần Thị C đã bình luận về công việc "Thiết kế giao diện trang chủ": "Đề xuất này rất hay, hãy thực hiện theo hướng này nhé!"',
    from: 'Trần Thị C',
    timestamp: '2026-03-15T16:45:00Z',
    read: true,
    starred: false,
    priority: 'normal',
  },
  {
    id: '5',
    type: 'reminder',
    subject: 'Nhắc nhở: Họp nhóm dự án',
    message: 'Nhắc nhở: Buổi họp nhóm về dự án sẽ diễn ra vào 10:00 sáng ngày mai. Vui lòng chuẩn bị tài liệu báo cáo tiến độ.',
    from: 'Hệ thống Taskify',
    timestamp: '2026-03-15T14:30:00Z',
    read: true,
    starred: true,
    priority: 'normal',
  },
  {
    id: '6',
    type: 'task-assigned',
    subject: 'Công việc mới: Kiểm tra bảo mật hệ thống',
    message: 'Bạn được giao nhiệm vụ kiểm tra bảo mật toàn bộ hệ thống. Cần hoàn thành trước ngày 22/03/2026.',
    from: 'Hệ thống Taskify',
    timestamp: '2026-03-15T10:00:00Z',
    read: true,
    starred: false,
    priority: 'high',
  },
];

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'starred'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getTypeIcon = (type: NotificationType) => {
    switch (type) {
      case 'task-assigned':
        return '📋';
      case 'task-completed':
        return '✅';
      case 'task-overdue':
        return '⚠️';
      case 'comment':
        return '💬';
      case 'reminder':
        return '🔔';
      default:
        return '📧';
    }
  };

  const getTypeColor = (type: NotificationType) => {
    switch (type) {
      case 'task-assigned':
        return 'bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'task-completed':
        return 'bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400';
      case 'task-overdue':
        return 'bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400';
      case 'comment':
        return 'bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400';
      case 'reminder':
        return 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-500/10 text-gray-600 dark:text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 1) return 'Vừa xong';
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  const toggleRead = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, read: !n.read } : n
    ));
  };

  const toggleStar = (id: string) => {
    setNotifications(notifications.map(n => 
      n.id === id ? { ...n, starred: !n.starred } : n
    ));
  };

  const deleteNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
    if (selectedNotification?.id === id) {
      setSelectedNotification(null);
    }
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread' && n.read) return false;
    if (filter === 'starred' && !n.starred) return false;
    if (searchQuery && !n.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Thông báo</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Bạn có {unreadCount} thông báo chưa đọc
          </p>
        </div>
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium"
        >
          Đánh dấu đã đọc tất cả
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notifications List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800">
          {/* Search and Filter */}
          <div className="p-4 border-b border-gray-200 dark:border-slate-800 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm thông báo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'all'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                Tất cả
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'unread'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                Chưa đọc
              </button>
              <button
                onClick={() => setFilter('starred')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === 'starred'
                    ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                Đánh dấu
              </button>
            </div>
          </div>

          {/* Notification Items */}
          <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Không có thông báo nào
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    setSelectedNotification(notification);
                    if (!notification.read) {
                      toggleRead(notification.id);
                    }
                  }}
                  className={`p-4 border-b border-gray-100 dark:border-slate-800 cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-slate-800 ${
                    selectedNotification?.id === notification.id ? 'bg-indigo-50 dark:bg-indigo-500/5' : ''
                  } ${!notification.read ? 'bg-blue-50/30 dark:bg-blue-500/5' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0 ${getTypeColor(notification.type)}`}>
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className={`text-sm font-semibold ${
                          !notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
                        } line-clamp-2`}>
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
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mb-1">
                        {notification.from}
                      </p>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Notification Detail */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-slate-800 p-6">
          {selectedNotification ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${getTypeColor(selectedNotification.type)}`}>
                      {getTypeIcon(selectedNotification.type)}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedNotification.subject}
                      </h2>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Từ: {selectedNotification.from}
                      </p>
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
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-400'
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

              {/* Timestamp and Priority */}
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4" />
                  <span>{formatTimestamp(selectedNotification.timestamp)}</span>
                </div>
                {selectedNotification.priority === 'high' && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-full text-xs font-medium">
                    Ưu tiên cao
                  </span>
                )}
              </div>

              {/* Message Content */}
              <div className="prose dark:prose-invert max-w-none">
                <div className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {selectedNotification.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-slate-800">
                <button className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-lg transition-colors font-medium">
                  Xem công việc
                </button>
                <button
                  onClick={() => toggleRead(selectedNotification.id)}
                  className="px-4 py-2 border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg transition-colors font-medium"
                >
                  {selectedNotification.read ? 'Đánh dấu chưa đọc' : 'Đánh dấu đã đọc'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MailOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Chọn một thông báo
                </h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Chọn một thông báo từ danh sách bên trái để xem chi tiết
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
