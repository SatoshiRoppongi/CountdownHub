import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { eventAPI } from '../services/api';
import { Comment } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { ReportButton } from './ReportButton';

interface CommentSectionProps {
  eventId: number;
}

interface CommentFormData {
  author_name: string;
  content: string;
}


export const CommentSection: React.FC<CommentSectionProps> = ({ eventId }) => {
  const { user, isAuthenticated } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CommentFormData>({
    author_name: user?.display_name || user?.username || '',
    content: '',
  });
  const [showForm, setShowForm] = useState(false);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(true);
  const [editingComment, setEditingComment] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const commentsPerPage = 10;

  const queryClient = useQueryClient();

  // 認証ユーザーの表示名を自動設定
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        author_name: user.display_name || user.username || ''
      }));
    }
  }, [user]);

  // コメント一覧取得（リアルタイム更新対応）
  const { data: commentData, isLoading, error } = useQuery({
    queryKey: ['comments', eventId, page, sortOrder],
    queryFn: () => eventAPI.getEventComments(eventId, page, commentsPerPage, sortOrder),
    enabled: !!eventId,
    refetchInterval: isRealTimeEnabled ? 30000 : false, // 30秒間隔で自動更新
    refetchIntervalInBackground: true,
  });

  // ソート変更時にページをリセット
  const handleSortChange = (newSort: 'desc' | 'asc') => {
    setSortOrder(newSort);
    setPage(1);
  };

  const comments = commentData?.comments || [];
  const total = commentData?.total || 0;
  const hasMore = commentData?.hasMore || false;

  // ページの可視性変更時にリアルタイム更新を制御
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsRealTimeEnabled(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // ユーザー情報が変更された際にフォームを更新
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        author_name: user.display_name || user.username || ''
      }));
    }
  }, [user]);

  // コメント投稿
  const createCommentMutation = useMutation({
    mutationFn: (commentData: CommentFormData) => 
      eventAPI.createEventComment(eventId, commentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      setFormData({ author_name: user?.display_name || user?.username || '', content: '' });
      setShowForm(false);
      setIsSubmitting(false);
    },
    onError: () => {
      setIsSubmitting(false);
    },
  });

  // コメント編集
  const updateCommentMutation = useMutation({
    mutationFn: ({ commentId, content }: { commentId: number; content: string }) =>
      eventAPI.updateEventComment(eventId, commentId, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', eventId] });
      setEditingComment(null);
      setEditContent('');
    },
  });

  // コメント削除
  const deleteCommentMutation = useMutation({
    mutationFn: (commentId: number) =>
      eventAPI.deleteEventComment(eventId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', eventId] });
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.content.trim()) {
      return;
    }
    
    setIsSubmitting(true);
    createCommentMutation.mutate(formData);
  };

  const handleEditStart = (comment: Comment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };

  const handleEditCancel = () => {
    setEditingComment(null);
    setEditContent('');
  };

  const handleEditSubmit = (commentId: number) => {
    if (!editContent.trim()) return;
    updateCommentMutation.mutate({ commentId, content: editContent.trim() });
  };

  const handleDelete = (commentId: number) => {
    if (window.confirm('このコメントを削除しますか？')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="font-semibold text-gray-700 mb-4 text-xl">💬 コメント</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center mb-2">
                <div className="h-4 bg-gray-200 rounded w-24 mr-4"></div>
                <div className="h-3 bg-gray-200 rounded w-20"></div>
              </div>
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="font-semibold text-gray-700 mb-4 text-xl">💬 コメント</h3>
        <div className="text-center py-8 text-red-500">
          コメントの読み込みに失敗しました
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 sm:mb-6 gap-3 sm:gap-4">
        <h3 className="font-semibold text-gray-700 text-lg sm:text-xl flex-shrink-0">
          💬 コメント ({total}件)
        </h3>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
          {/* リアルタイム更新ステータス */}
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${isRealTimeEnabled ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-gray-600 whitespace-nowrap">
              {isRealTimeEnabled ? 'リアルタイム更新中' : '更新停止中'}
            </span>
            <button
              onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
              className="text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
            >
              {isRealTimeEnabled ? '停止' : '開始'}
            </button>
          </div>
          {isAuthenticated ? (
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-500 text-white px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm font-medium whitespace-nowrap"
            >
              {showForm ? 'キャンセル' : 'コメント投稿'}
            </button>
          ) : (
            <div className="text-xs sm:text-sm text-gray-600">
              <span className="block sm:inline">コメント投稿には</span>
              <Link to="/login" className="text-blue-600 font-medium hover:text-blue-800 underline">ログイン</Link>
              <span className="block sm:inline">が必要です</span>
            </div>
          )}
        </div>
      </div>

      {/* ソート選択 */}
      {total > 0 && (
        <div className="flex justify-center sm:justify-end mb-3 sm:mb-4">
          <div className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm">
            <span className="text-gray-600 whitespace-nowrap">並び順:</span>
            <button
              onClick={() => handleSortChange('desc')}
              className={`px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap text-xs sm:text-sm ${
                sortOrder === 'desc' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              新しい順
            </button>
            <button
              onClick={() => handleSortChange('asc')}
              className={`px-2 sm:px-3 py-1 rounded-md transition-colors whitespace-nowrap text-xs sm:text-sm ${
                sortOrder === 'asc' 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              古い順
            </button>
          </div>
        </div>
      )}

      {/* コメント投稿フォーム */}
      {showForm && isAuthenticated && (
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="mb-4">
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              コメント *
            </label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="コメントを入力してください"
              rows={4}
              maxLength={1000}
              required
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.content.length}/1000文字
            </div>
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.content.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? '投稿中...' : '投稿する'}
            </button>
          </div>
        </form>
      )}

      {/* コメント一覧 */}
      {comments && comments.length > 0 ? (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-4 last:border-b-0">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1 sm:gap-2">
                <div className="flex flex-col sm:flex-row sm:items-center min-w-0">
                  <div className="flex items-center space-x-2 mr-0 sm:mr-3">
                    {comment.user?.avatar_url ? (
                      <img
                        src={comment.user.avatar_url}
                        alt={comment.author_name}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-gray-600">
                          {comment.author_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    {comment.user?.username ? (
                      <Link
                        to={`/users/${comment.user.username}`}
                        className="font-medium text-blue-600 hover:text-blue-800 text-sm sm:text-base truncate transition-colors"
                      >
                        {comment.author_name}
                      </Link>
                    ) : (
                      <span className="font-medium text-gray-900 text-sm sm:text-base truncate">
                        {comment.author_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <span className="text-xs sm:text-sm text-gray-500">
                      {formatDate(comment.created_at)}
                    </span>
                    {comment.updated_at && comment.updated_at !== comment.created_at && (
                      <span className="text-xs text-gray-400">
                        (編集済み)
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
                  {comment.is_reported && (
                    <span className="text-xs bg-red-100 text-red-600 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full whitespace-nowrap">
                      通報済み
                    </span>
                  )}
                  <div className="flex items-center space-x-1">
                    {!comment.is_reported && isAuthenticated && user && comment.user_id === user.id && (
                      <>
                        <button
                          onClick={() => handleEditStart(comment)}
                          className="text-blue-600 hover:text-blue-800 text-xs sm:text-sm underline whitespace-nowrap"
                        >
                          編集
                        </button>
                        <button
                          onClick={() => handleDelete(comment.id)}
                          className="text-red-600 hover:text-red-800 text-xs sm:text-sm underline whitespace-nowrap"
                        >
                          削除
                        </button>
                      </>
                    )}
                    {!comment.is_reported && isAuthenticated && user && comment.user_id !== user.id && (
                      <ReportButton 
                        type="comment"
                        targetId={comment.id.toString()}
                        size="sm"
                        className="text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* 編集フォーム */}
              {editingComment === comment.id ? (
                <div className="mt-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    maxLength={1000}
                  />
                  <div className="flex justify-end space-x-2 mt-2">
                    <button
                      onClick={handleEditCancel}
                      className="px-3 py-1 text-gray-600 bg-gray-200 rounded text-sm hover:bg-gray-300 transition-colors"
                    >
                      キャンセル
                    </button>
                    <button
                      onClick={() => handleEditSubmit(comment.id)}
                      disabled={updateCommentMutation.isPending || !editContent.trim()}
                      className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {updateCommentMutation.isPending ? '更新中...' : '更新'}
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">💭</div>
          <p>まだコメントがありません</p>
          <p className="text-sm">最初のコメントを投稿してみませんか？</p>
        </div>
      )}

      {/* ページネーション */}
      {total > commentsPerPage && (
        <div className="flex justify-center items-center space-x-4 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            前へ
          </button>
          
          <span className="text-sm text-gray-600">
            ページ {page} / {Math.ceil(total / commentsPerPage)}
          </span>
          
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
            className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            次へ
          </button>
        </div>
      )}
    </div>
  );
};