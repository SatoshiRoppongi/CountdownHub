import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { favoriteAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface FavoriteButtonProps {
  eventId: number;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const FavoriteButton: React.FC<FavoriteButtonProps> = ({ 
  eventId, 
  size = 'medium',
  className = ''
}) => {
  const { isAuthenticated } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  // お気に入り状態を取得
  const { data: favoriteStatus, isLoading } = useQuery({
    queryKey: ['favorite-status', eventId],
    queryFn: () => favoriteAPI.checkFavoriteStatus(eventId),
    enabled: !!eventId,
  });

  const isFavorited = favoriteStatus?.is_favorited || false;

  // お気に入り追加・削除のmutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      if (isFavorited) {
        await favoriteAPI.removeFavorite(eventId);
      } else {
        await favoriteAPI.addFavorite(eventId);
      }
    },
    onSuccess: () => {
      // お気に入り状態とイベント一覧を更新
      queryClient.invalidateQueries({ queryKey: ['favorite-status', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['favorites'] });
      
      showSuccess(isFavorited ? 'お気に入りから削除しました' : 'お気に入りに追加しました');
    },
    onError: () => {
      showError('お気に入りの更新に失敗しました');
    },
  });

  const handleToggleFavorite = () => {
    if (!isAuthenticated) {
      showError('お気に入り機能を使用するにはログインが必要です');
      return;
    }

    toggleFavoriteMutation.mutate();
  };

  // サイズに応じたスタイル
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'px-2 py-1 text-xs';
      case 'large':
        return 'px-6 py-3 text-base';
      default:
        return 'px-4 py-2 text-sm';
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 'text-sm';
      case 'large':
        return 'text-lg';
      default:
        return 'text-base';
    }
  };

  if (isLoading) {
    return (
      <button
        disabled
        className={`
          ${getSizeClasses()}
          bg-gray-100 text-gray-400 rounded-lg 
          border border-gray-200 cursor-not-allowed
          transition-colors duration-200
          ${className}
        `}
      >
        <span className={getIconSize()}>⏳</span>
      </button>
    );
  }

  return (
    <button
      onClick={handleToggleFavorite}
      disabled={toggleFavoriteMutation.isPending || !isAuthenticated}
      className={`
        ${getSizeClasses()}
        ${isFavorited 
          ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
        }
        rounded-lg border transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-1 font-medium
        ${className}
      `}
      title={
        !isAuthenticated 
          ? 'ログインが必要です'
          : isFavorited 
            ? 'お気に入りから削除' 
            : 'お気に入りに追加'
      }
    >
      <span className={getIconSize()}>
        {toggleFavoriteMutation.isPending ? '⏳' : isFavorited ? '❤️' : '🤍'}
      </span>
      {size !== 'small' && (
        <span>
          {isFavorited ? 'お気に入り済み' : 'お気に入り'}
        </span>
      )}
    </button>
  );
};