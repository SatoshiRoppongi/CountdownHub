import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

interface AdminStatus {
  isAdmin: boolean;
  user?: {
    email: string;
    username: string;
    auth_provider: string;
  };
  error?: string;
}

export const useAdmin = () => {
  const { token, isAuthenticated } = useAuth();

  const { data: adminStatus, isLoading } = useQuery<AdminStatus>({
    queryKey: ['admin-status'],
    queryFn: async () => {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/admin/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          return { isAdmin: false, error: '認証が必要です' };
        }
        throw new Error('管理者ステータスの確認に失敗しました');
      }
      
      return response.json();
    },
    enabled: !!token && isAuthenticated,
    retry: false,
  });

  return {
    isAdmin: adminStatus?.isAdmin || false,
    isLoading,
    error: adminStatus?.error,
  };
};