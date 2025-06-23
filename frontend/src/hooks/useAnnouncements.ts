import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnnouncementsResponse, Announcement } from '../types';

// アクティブなお知らせ取得（ユーザー向け）
const fetchActiveAnnouncements = async (): Promise<AnnouncementsResponse> => {
  const response = await fetch('/api/announcements/active');
  if (!response.ok) {
    throw new Error('お知らせの取得に失敗しました');
  }
  return response.json();
};

// 管理者向けお知らせ一覧取得
const fetchAnnouncementsAdmin = async (params: {
  page?: number;
  limit?: number;
  type?: string;
  priority?: string;
  is_active?: boolean;
}): Promise<AnnouncementsResponse> => {
  const searchParams = new URLSearchParams();
  
  if (params.page) searchParams.append('page', params.page.toString());
  if (params.limit) searchParams.append('limit', params.limit.toString());
  if (params.type) searchParams.append('type', params.type);
  if (params.priority) searchParams.append('priority', params.priority);
  if (params.is_active !== undefined) searchParams.append('is_active', params.is_active.toString());

  const response = await fetch(`/api/announcements/admin?${searchParams}`);
  if (!response.ok) {
    throw new Error('お知らせの取得に失敗しました');
  }
  return response.json();
};

// お知らせ作成
const createAnnouncement = async (data: Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'creator'>): Promise<{ message: string; announcement: Announcement }> => {
  const response = await fetch('/api/announcements', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'お知らせの作成に失敗しました');
  }

  return response.json();
};

// お知らせ更新
const updateAnnouncement = async ({ id, ...data }: Partial<Announcement> & { id: number }): Promise<{ message: string; announcement: Announcement }> => {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'お知らせの更新に失敗しました');
  }

  return response.json();
};

// お知らせ削除
const deleteAnnouncement = async (id: number): Promise<{ message: string }> => {
  const response = await fetch(`/api/announcements/${id}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'お知らせの削除に失敗しました');
  }

  return response.json();
};

// ユーザー向け：アクティブなお知らせ取得
export const useActiveAnnouncements = () => {
  return useQuery({
    queryKey: ['announcements', 'active'],
    queryFn: fetchActiveAnnouncements,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });
};

// 管理者向け：お知らせ一覧取得
export const useAnnouncementsAdmin = (params: Parameters<typeof fetchAnnouncementsAdmin>[0] = {}) => {
  return useQuery({
    queryKey: ['announcements', 'admin', params],
    queryFn: () => fetchAnnouncementsAdmin(params),
    enabled: !!params, // パラメータが設定されている場合のみ実行
  });
};

// お知らせ作成
export const useCreateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createAnnouncement,
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

// お知らせ更新
export const useUpdateAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateAnnouncement,
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};

// お知らせ削除
export const useDeleteAnnouncement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteAnnouncement,
    onSuccess: () => {
      // キャッシュを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
    },
  });
};