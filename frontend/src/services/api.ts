import axios from 'axios';
import { Event, EventsResponse, Comment, AdminStats, EventFilters } from '../types';

// 本番環境での API URL を動的に決定
const getApiBaseUrl = () => {
  // 環境変数が設定されている場合はそれを使用
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 本番環境では専用のAPIドメインを使用
  if (process.env.NODE_ENV === 'production') {
    const hostname = window.location.hostname;
    if (hostname === 'www.countdownhub.jp' || hostname === 'countdownhub.jp') {
      return 'https://api.countdownhub.jp';
    }
    return window.location.origin;
  }
  
  // 開発環境ではローカルホストを使用
  return 'http://localhost:3001';
};

const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 認証ヘッダーの自動送信
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('countdown_hub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// レスポンスエラーハンドリング
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 認証エラーの場合、トークンを削除してログインページにリダイレクト
      localStorage.removeItem('countdown_hub_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

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

  checkStatus: async (): Promise<{ isAdmin: boolean; details: any }> => {
    const response = await api.get('/admin/status');
    return response.data;
  },

  getUsers: async (params: { 
    page?: number; 
    limit?: number; 
    search?: string; 
  } = {}): Promise<{
    users: Array<{
      id: string;
      username: string;
      display_name: string;
      email: string;
      avatar_url?: string;
      is_active: boolean;
      is_admin: boolean;
      auth_provider: string;
      created_at: string;
      updated_at: string;
      _count: {
        events: number;
        comments: number;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  getUserById: async (id: string): Promise<{
    id: string;
    username: string;
    display_name: string;
    email: string;
    avatar_url?: string;
    is_active: boolean;
    is_admin: boolean;
    auth_provider: string;
    created_at: string;
    updated_at: string;
    events: Array<{
      id: number;
      title: string;
      start_datetime: string;
      is_active: boolean;
      created_at: string;
    }>;
    comments: Array<{
      id: number;
      content: string;
      is_reported: boolean;
      created_at: string;
      event: {
        id: number;
        title: string;
      };
    }>;
    _count: {
      events: number;
      comments: number;
    };
  }> => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id: string, data: {
    is_active?: boolean;
    is_admin?: boolean;
  }): Promise<{
    id: string;
    username: string;
    display_name: string;
    email: string;
    is_active: boolean;
    is_admin: boolean;
  }> => {
    const response = await api.patch(`/admin/users/${id}/status`, data);
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

export const authAPI = {
  register: async (userData: {
    email: string;
    username: string;
    password: string;
    display_name?: string;
  }): Promise<{ message: string; user: any; token: string }> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials: {
    email: string;
    password: string;
  }): Promise<{ message: string; user: any; token: string }> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  getProfile: async (): Promise<{ user: any }> => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  updateProfile: async (userData: {
    display_name?: string;
    bio?: string;
  }): Promise<{ message: string; user: any }> => {
    const response = await api.patch('/auth/profile', userData);
    return response.data;
  },

  checkDisplayNameAvailability: async (displayName: string): Promise<{ available: boolean; message: string }> => {
    const response = await api.get('/auth/check-display-name', {
      params: { display_name: displayName }
    });
    return response.data;
  },

  logout: async (): Promise<{ message: string }> => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
};

export const userAPI = {
  getUserEvents: async (): Promise<{ events: Event[] }> => {
    const response = await api.get('/users/events');
    return response.data;
  },

  getUserComments: async (): Promise<{ comments: (Comment & { event: { id: number; title: string } })[] }> => {
    const response = await api.get('/users/comments');
    return response.data;
  },

  getUserProfile: async (username: string): Promise<{
    user: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      bio?: string;
      created_at: string;
      _count: {
        events: number;
        comments: number;
        followers: number;
        following: number;
      };
      isFollowing: boolean;
    };
  }> => {
    const response = await api.get(`/auth/users/${username}`);
    return response.data;
  },

  getUserPublicEvents: async (username: string, page = 1, limit = 20): Promise<EventsResponse> => {
    const response = await api.get(`/auth/users/${username}/events`, { params: { page, limit } });
    return response.data;
  },

  searchUsers: async (params: {
    search: string;
    page?: number;
    limit?: number;
  }): Promise<{
    users: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      bio?: string;
      created_at: string;
      _count: {
        events: number;
        comments: number;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get('/auth/search/users', { params });
    return response.data;
  },

  followUser: async (username: string): Promise<{
    message: string;
    isFollowing: boolean;
  }> => {
    const response = await api.post(`/auth/users/${username}/follow`);
    return response.data;
  },

  unfollowUser: async (username: string): Promise<{
    message: string;
    isFollowing: boolean;
  }> => {
    const response = await api.delete(`/auth/users/${username}/follow`);
    return response.data;
  },

  getUserFollowers: async (username: string, params: { 
    page?: number; 
    limit?: number; 
  } = {}): Promise<{
    followers: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      bio?: string;
      _count: {
        followers: number;
        following: number;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get(`/auth/users/${username}/followers`, { params });
    return response.data;
  },

  getUserFollowing: async (username: string, params: { 
    page?: number; 
    limit?: number; 
  } = {}): Promise<{
    following: Array<{
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      bio?: string;
      _count: {
        followers: number;
        following: number;
      };
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get(`/auth/users/${username}/following`, { params });
    return response.data;
  },
};

export const contactAPI = {
  submitContact: async (data: {
    name: string;
    email: string;
    subject: string;
    category: string;
    message: string;
  }): Promise<{ message: string; contact: { id: number; created_at: string } }> => {
    const response = await api.post('/contact', data);
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

export const reportAPI = {
  createReport: async (data: {
    type: 'user' | 'comment' | 'event';
    target_id: string;
    reason: string;
    description?: string;
  }): Promise<{
    message: string;
    report: {
      id: number;
      type: string;
      reason: string;
      status: string;
      created_at: string;
    };
  }> => {
    const response = await api.post('/reports', data);
    return response.data;
  },

  getReports: async (params: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  } = {}): Promise<{
    reports: Array<{
      id: number;
      type: string;
      target_id: string;
      reason: string;
      description?: string;
      status: string;
      created_at: string;
      updated_at: string;
      target_info?: any;
    }>;
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> => {
    const response = await api.get('/reports', { params });
    return response.data;
  },

  updateReportStatus: async (id: number, data: {
    status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
    admin_note?: string;
  }): Promise<{
    message: string;
    report: any;
  }> => {
    const response = await api.patch(`/reports/${id}/status`, data);
    return response.data;
  },

  getReportStats: async (): Promise<{
    total: number;
    by_status: {
      pending: number;
      reviewed: number;
      resolved: number;
      dismissed: number;
    };
    by_type: {
      user: number;
      comment: number;
      event: number;
    };
  }> => {
    const response = await api.get('/reports/stats');
    return response.data;
  },
};

export default api;