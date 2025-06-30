export interface Event {
  id: number;
  title: string;
  description: string | null;
  start_datetime: string;
  end_datetime: string | null;
  location: string | null;
  venue_type: 'online' | 'offline' | 'hybrid' | null;
  site_url: string | null;
  image_url: string | null;
  tags: string[];
  is_active: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  user?: {
    id: string;
    display_name: string;
    username: string;
  };
  _count: {
    comments: number;
    favorites?: number;
  };
  is_favorited?: boolean;
}

export interface Comment {
  id: number;
  event_id: number;
  author_name: string;
  content: string;
  is_reported: boolean;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  user?: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface EventsResponse {
  events: Event[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type SortOption = 
  | 'start_datetime_asc'   // 開催日時昇順
  | 'start_datetime_desc'  // 開催日時降順
  | 'created_at_asc'       // 作成日時昇順
  | 'created_at_desc'      // 作成日時降順
  | 'comments_desc'        // コメント数順
  | 'favorites_desc';      // お気に入り数順

export interface EventFilters {
  search?: string;
  tags?: string[];
  venue_type?: 'online' | 'offline' | 'hybrid';
  sort_by?: 'start_datetime' | 'created_at' | 'comments' | 'favorites';
  order?: 'asc' | 'desc';
  dateRange?: {
    start_date: string;
    end_date: string;
  };
  timeCategory?: 'today' | 'upcoming' | 'ongoing' | 'ended';
}

export interface AdminStats {
  events: number;
  comments: number;
  reportedComments: number;
  users: number;
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  auth_provider?: string;
  google_id?: string;
  github_id?: string;
  twitter_id?: string;
  line_id?: string;
  is_active?: boolean;
  is_admin?: boolean;
  updated_at?: string;
  _count?: {
    events: number;
    comments: number;
  };
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  is_active: boolean;
  start_date: string | null;
  end_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  creator?: {
    id: string;
    display_name: string;
    username: string;
  };
}

export type AnnouncementType = 'info' | 'maintenance' | 'feature' | 'warning' | 'emergency';
export type AnnouncementPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface AnnouncementsResponse {
  announcements: Announcement[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}