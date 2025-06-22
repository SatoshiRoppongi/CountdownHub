import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { notificationAPI } from '../services/api';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  action_url?: string;
  action_text?: string;
  created_at: string;
  event?: { id: number; title: string; start_datetime: string };
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onClose: () => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead, onClose }) => {

  const handleClick = () => {
    if (!notification.read) {
      onMarkAsRead();
    }
    
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    onClose();
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '今';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}分前`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}時間前`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}日前`;
    
    return date.toLocaleDateString('ja-JP');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'event_started': return '🎉';
      case 'event_starting_soon': return '⏰';
      case 'new_comment': return '💬';
      case 'event_updated': return '📝';
      case 'event_cancelled': return '❌';
      case 'favorite_event_reminder': return '⭐';
      default: return '🔔';
    }
  };

  return (
    <div
      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <span className="text-lg mt-1">{getTypeIcon(notification.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className={`text-sm font-medium text-gray-900 ${!notification.read ? 'font-semibold' : ''}`}>
              {notification.title}
            </h4>
            {!notification.read && (
              <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {formatTimeAgo(notification.created_at)}
            </span>
            {notification.action_text && (
              <span className="text-xs text-blue-600 font-medium">
                {notification.action_text} →
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export const NotificationBell: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
      fetchUnreadCount();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await notificationAPI.getUserNotifications({ limit: 10 });
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error: any) {
      // 通知機能が未実装の場合（404, 401）はサイレントに処理
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        setNotifications([]);
        setUnreadCount(0);
      } else {
        console.error('Failed to fetch notifications:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error: any) {
      // 通知機能が未実装の場合（404, 401）はサイレントに処理
      if (error?.response?.status === 401 || error?.response?.status === 404) {
        setUnreadCount(0);
      } else {
        console.error('Failed to fetch unread count:', error);
      }
    }
  };

  const markAsRead = async (notificationIds: number[]) => {
    try {
      await notificationAPI.markAsRead(notificationIds);
      setNotifications(prev => 
        prev.map(n => notificationIds.includes(n.id) ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - notificationIds.length));
    } catch (error) {
      console.error('Failed to mark as read:', error);
      showToast({
        type: 'error',
        title: 'エラー',
        message: '通知の既読処理に失敗しました'
      });
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast({
        type: 'success',
        title: '完了',
        message: 'すべての通知を既読にしました'
      });
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast({
        type: 'error',
        title: 'エラー',
        message: '通知の既読処理に失敗しました'
      });
    }
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="通知"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 17h5l-5 5v-5zM21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[20px] h-5 flex items-center justify-center px-1 font-bold">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-40 max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <span className="mr-2">🔔</span>
                  通知
                </h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                  >
                    すべて既読
                  </button>
                )}
              </div>
            </div>
            
            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-sm text-gray-500 mt-2">読み込み中...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <div className="text-4xl mb-3">📭</div>
                  <p className="text-sm">通知はありません</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={() => markAsRead([notification.id])}
                    onClose={() => setIsOpen(false)}
                  />
                ))
              )}
            </div>
            
            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // TODO: Navigate to notifications page
                  }}
                  className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                >
                  すべての通知を見る
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};