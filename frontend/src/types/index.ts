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
}

export interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  auth_provider?: string;
  google_id?: string;
  github_id?: string;
  twitter_id?: string;
  line_id?: string;
}