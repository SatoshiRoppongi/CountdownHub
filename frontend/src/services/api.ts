import axios from 'axios';
import { Event, EventsResponse, Comment, AdminStats, EventFilters } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 認証ヘッダーの自動送信
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const eventAPI = {
  getEvents: async (params: EventFilters & { page?: number; limit?: number } = {}): Promise<EventsResponse> => {
    const response = await api.get('/events', { params });
    return response.data;
  },

  getEventById: async (id: number): Promise<Event> => {
    const response = await api.get(`/events/${id}`);
    return response.data;
  },

  createEvent: async (eventData: Partial<Event>): Promise<Event> => {
    const response = await api.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (id: number, eventData: Partial<Event>): Promise<Event> => {
    const response = await api.put(`/events/${id}`, eventData);
    return response.data;
  },

  deleteEvent: async (id: number): Promise<void> => {
    await api.delete(`/events/${id}`);
  },

  getEventComments: async (eventId: number, page = 1, limit = 10, sort = 'desc'): Promise<{
    comments: Comment[];
    total: number;
    hasMore: boolean;
    page: number;
    limit: number;
  }> => {
    const response = await api.get(`/events/${eventId}/comments`, {
      params: { page, limit, sort }
    });
    return response.data;
  },

  createEventComment: async (eventId: number, commentData: { author_name: string; content: string }): Promise<Comment> => {
    const response = await api.post(`/events/${eventId}/comments`, commentData);
    return response.data;
  },

  updateEventComment: async (eventId: number, commentId: number, commentData: { content: string }): Promise<Comment> => {
    const response = await api.put(`/events/${eventId}/comments/${commentId}`, commentData);
    return response.data;
  },

  deleteEventComment: async (eventId: number, commentId: number): Promise<void> => {
    await api.delete(`/events/${eventId}/comments/${commentId}`);
  },
};

export const commentAPI = {
  deleteComment: async (id: number): Promise<void> => {
    await api.delete(`/comments/${id}`);
  },

  reportComment: async (id: number): Promise<void> => {
    await api.post(`/comments/${id}/report`);
  },
};

export const adminAPI = {
  getStats: async (): Promise<AdminStats> => {
    const response = await api.get('/admin/stats');
    return response.data;
  },

  importEventsFromCSV: async (file: File): Promise<{ message: string; count: number }> => {
    const formData = new FormData();
    formData.append('csvFile', file);
    
    const response = await api.post('/admin/events/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export const favoriteAPI = {
  addFavorite: async (eventId: number): Promise<void> => {
    await api.post(`/favorites/events/${eventId}`);
  },

  removeFavorite: async (eventId: number): Promise<void> => {
    await api.delete(`/favorites/events/${eventId}`);
  },

  getUserFavorites: async (page = 1, limit = 20): Promise<EventsResponse> => {
    const response = await api.get('/favorites', { params: { page, limit } });
    return response.data;
  },

  checkFavoriteStatus: async (eventId: number): Promise<{ is_favorited: boolean }> => {
    const response = await api.get(`/favorites/events/${eventId}/status`);
    return response.data;
  },
};

export const notificationAPI = {
  getUserNotifications: async (params: { page?: number; limit?: number; unread_only?: boolean } = {}): Promise<{
    notifications: Array<{
      id: number;
      type: string;
      title: string;
      message: string;
      read: boolean;
      action_url?: string;
      action_text?: string;
      created_at: string;
      event?: { id: number; title: string; start_datetime: string };
    }>;
    unreadCount: number;
  }> => {
    const response = await api.get('/notifications', { params });
    return response.data;
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationIds: number[]): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch('/notifications/mark-read', { notification_ids: notificationIds });
    return response.data;
  },

  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    const response = await api.patch('/notifications/mark-all-read');
    return response.data;
  },

  deleteNotification: async (id: number): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  getSettings: async (): Promise<{
    id: number;
    user_id: string;
    email_enabled: boolean;
    browser_enabled: boolean;
    event_reminders: boolean;
    comment_notifications: boolean;
    event_updates: boolean;
    weekly_digest: boolean;
    created_at: string;
    updated_at: string;
  }> => {
    const response = await api.get('/notifications/settings');
    return response.data;
  },

  updateSettings: async (settings: {
    email_enabled?: boolean;
    browser_enabled?: boolean;
    event_reminders?: boolean;
    comment_notifications?: boolean;
    event_updates?: boolean;
    weekly_digest?: boolean;
  }): Promise<{
    settings: any;
    success: boolean;
    message: string;
  }> => {
    const response = await api.patch('/notifications/settings', settings);
    return response.data;
  },
};

export default api;