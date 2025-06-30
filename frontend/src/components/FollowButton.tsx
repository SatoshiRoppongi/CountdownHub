import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface FollowButtonProps {
  username: string;
  isFollowing: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

export const FollowButton: React.FC<FollowButtonProps> = ({
  username,
  isFollowing,
  className = '',
  size = 'md',
  variant = 'primary'
}) => {
  const { isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useToast();
  const queryClient = useQueryClient();

  const followMutation = useMutation({
    mutationFn: () => userAPI.followUser(username),
    onSuccess: (data) => {
      showSuccess(data.message);
      // ユーザープロフィールのキャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
      queryClient.invalidateQueries({ queryKey: ['userFollowers', username] });
      queryClient.invalidateQueries({ queryKey: ['userFollowing', user?.username] });
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || 'フォローに失敗しました');
    }
  });

  const unfollowMutation = useMutation({
    mutationFn: () => userAPI.unfollowUser(username),
    onSuccess: (data) => {
      showSuccess(data.message);
      // ユーザープロフィールのキャッシュを更新
      queryClient.invalidateQueries({ queryKey: ['userProfile', username] });
      queryClient.invalidateQueries({ queryKey: ['userFollowers', username] });
      queryClient.invalidateQueries({ queryKey: ['userFollowing', user?.username] });
    },
    onError: (error: any) => {
      showError(error.response?.data?.error || 'フォロー解除に失敗しました');
    }
  });

  // 自分自身の場合はボタンを表示しない
  if (user?.username === username) {
    return null;
  }

  const handleClick = () => {
    if (!isAuthenticated) {
      showError('フォローするにはログインが必要です');
      return;
    }

    if (isFollowing) {
      unfollowMutation.mutate();
    } else {
      followMutation.mutate();
    }
  };

  const isLoading = followMutation.isPending || unfollowMutation.isPending;

  // サイズクラス
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  // バリアントクラス
  const variantClasses = {
    primary: isFollowing 
      ? 'bg-gray-500 hover:bg-gray-600 text-white' 
      : 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: isFollowing 
      ? 'bg-gray-200 hover:bg-gray-300 text-gray-700 border border-gray-300' 
      : 'bg-white hover:bg-blue-50 text-blue-600 border border-blue-600'
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded-lg font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        ${className}
      `}
    >
      {isLoading ? (
        <div className="flex items-center space-x-1">
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin"></div>
          <span>{isFollowing ? 'フォロー解除中...' : 'フォロー中...'}</span>
        </div>
      ) : (
        <span>{isFollowing ? 'フォロー中' : 'フォロー'}</span>
      )}
    </button>
  );
};