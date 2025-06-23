import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AnnouncementsResponse, Announcement } from '../types';
import api from '../services/api';

// アクティブなお知らせ取得（ユーザー向け）
const fetchActiveAnnouncements = async (): Promise<AnnouncementsResponse> => {
  const response = await api.get('/announcements/active');
  return response.data;
};

// 管理者向けお知らせ一覧取得
const fetchAnnouncementsAdmin = async (params: {
  page?: number;
  limit?: number;
  type?: string;
  priority?: string;
  is_active?: boolean;
}): Promise<AnnouncementsResponse> => {
  const response = await api.get('/announcements/admin', { params });
  return response.data;
};

// お知らせ作成
const createAnnouncement = async (data: Omit<Announcement, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'creator'>): Promise<{ message: string; announcement: Announcement }> => {
  const response = await api.post('/announcements', data);
  return response.data;
};

// お知らせ更新
const updateAnnouncement = async ({ id, ...data }: Partial<Announcement> & { id: number }): Promise<{ message: string; announcement: Announcement }> => {
  const response = await api.put(`/announcements/${id}`, data);
  return response.data;
};

// お知らせ削除
const deleteAnnouncement = async (id: number): Promise<{ message: string }> => {
  const response = await api.delete(`/announcements/${id}`);
  return response.data;
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