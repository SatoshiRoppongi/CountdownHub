import React, { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { eventAPI, commentAPI, authAPI, userAPI } from '../services/api';
import { Event } from '../types';
import { Link } from 'react-router-dom';

interface UserProfileUpdate {
  display_name?: string;
  bio?: string;
}

export const ProfilePage: React.FC = () => {
  const { user, token, updateUser } = useAuth();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [newNickname, setNewNickname] = useState(user?.display_name || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBio, setNewBio] = useState(user?.bio || '');
  const [activeTab, setActiveTab] = useState<'events' | 'comments'>('events');
  const [nicknameStatus, setNicknameStatus] = useState<'available' | 'unavailable' | 'checking' | null>(null);
  const [nicknameError, setNicknameError] = useState<string>('');

  // ユーザー情報が更新されたときに値を同期
  useEffect(() => {
    setNewNickname(user?.display_name || '');
    setNewBio(user?.bio || '');
    setNicknameStatus(null);
    setNicknameError('');
  }, [user?.display_name, user?.bio]);

  // ニックネーム重複チェック
  const checkNicknameAvailability = useCallback(
    async (nickname: string) => {
      if (!nickname.trim() || nickname.trim() === user?.display_name) {
        setNicknameStatus(null);
        setNicknameError('');
        return;
      }

      if (nickname.trim().length === 0) {
        setNicknameStatus('unavailable');
        setNicknameError('ニックネームを入力してください');
        return;
      }

      if (nickname.trim().length > 100) {
        setNicknameStatus('unavailable');
        setNicknameError('ニックネームは100文字以下で入力してください');
        return;
      }

      setNicknameStatus('checking');
      setNicknameError('');
      
      try {
        const result = await authAPI.checkDisplayNameAvailability(nickname.trim());
        setNicknameStatus(result.available ? 'available' : 'unavailable');
        
        if (!result.available) {
          setNicknameError(result.message);
        }
      } catch (error) {
        console.error('Nickname check error:', error);
        setNicknameStatus(null);
        setNicknameError('');
      }
    },
    [user?.display_name]
  );

  // デバウンス処理
  useEffect(() => {
    if (!newNickname.trim() || newNickname.trim() === user?.display_name) {
      setNicknameStatus(null);
      setNicknameError('');
      return;
    }

    const timeoutId = setTimeout(() => {
      checkNicknameAvailability(newNickname);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [newNickname, checkNicknameAvailability, user?.display_name]);

  // ユーザーのイベント一覧を取得
  const { data: userEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['user-events'],
    queryFn: () => userAPI.getUserEvents(),
    enabled: !!token,
  });

  // ユーザーのコメント一覧を取得
  const { data: userComments, isLoading: commentsLoading } = useQuery({
    queryKey: ['user-comments'],
    queryFn: () => userAPI.getUserComments(),
    enabled: !!token,
  });

  // プロフィール更新（ニックネーム）
  const updateProfileMutation = useMutation({
    mutationFn: (profileData: UserProfileUpdate) => authAPI.updateProfile(profileData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      queryClient.invalidateQueries({ queryKey: ['user-comments'] });
      // APIレスポンスから直接ユーザー情報を更新
      if (data && data.user) {
        updateUser(data.user);
      }
      showToast({
        type: 'success',
        title: '更新完了',
        message: 'ニックネームを更新しました',
      });
      setIsEditingNickname(false);
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'エラー',
        message: 'ニックネームの更新に失敗しました',
      });
    },
  });

  // 自己紹介文更新
  const updateBioMutation = useMutation({
    mutationFn: (bioData: { bio: string }) => authAPI.updateProfile(bioData),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      // APIレスポンスから直接ユーザー情報を更新
      if (data && data.user) {
        updateUser(data.user);
      }
      showToast({
        type: 'success',
        title: '更新完了',
        message: '自己紹介文を更新しました',
      });
      setIsEditingBio(false);
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'エラー',
        message: '自己紹介文の更新に失敗しました',
      });
    },
  });

  // イベント削除
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: number) => {
      await eventAPI.deleteEvent(eventId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      showToast({
        type: 'success',
        title: '削除完了',
        message: 'イベントを削除しました',
      });
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'エラー',
        message: 'イベントの削除に失敗しました',
      });
    },
  });

  // コメント削除
  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => {
      await commentAPI.deleteComment(commentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-comments'] });
      showToast({
        type: 'success',
        title: '削除完了',
        message: 'コメントを削除しました',
      });
    },
    onError: () => {
      showToast({
        type: 'error',
        title: 'エラー',
        message: 'コメントの削除に失敗しました',
      });
    },
  });

  const handleNicknameUpdate = () => {
    if (newNickname.trim() === '') {
      showToast({
        type: 'error',
        title: 'エラー',
        message: 'ニックネームを入力してください',
      });
      return;
    }

    if (nicknameStatus === 'unavailable') {
      showToast({
        type: 'error',
        title: 'エラー',
        message: nicknameError || 'このニックネームは使用できません',
      });
      return;
    }

    if (nicknameStatus === 'checking') {
      showToast({
        type: 'warning',
        title: '確認中',
        message: 'ニックネームの確認が完了するまでお待ちください',
      });
      return;
    }

    updateProfileMutation.mutate({ display_name: newNickname.trim() });
  };

  const handleSaveBio = () => {
    updateBioMutation.mutate({ bio: newBio.trim() });
  };

  const handleDeleteEvent = (eventId: number) => {
    if (window.confirm('このイベントを削除しますか？この操作は取り消せません。')) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    if (window.confirm('このコメントを削除しますか？この操作は取り消せません。')) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">ログインが必要です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* プロフィール情報 */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center space-x-4 mb-6">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-20 h-20 rounded-full"
            />
          ) : (
            <div className="w-20 h-20 bg-blue-500 text-white rounded-full flex items-center justify-center text-2xl font-medium">
              {user.display_name?.charAt(0) || user.username?.charAt(0) || '?'}
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              {isEditingNickname ? (
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center space-x-2">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={newNickname}
                        onChange={(e) => setNewNickname(e.target.value)}
                        className={`px-3 py-1 pr-8 border rounded-lg ${
                          nicknameError 
                            ? 'border-red-500' 
                            : nicknameStatus === 'available'
                            ? 'border-green-500'
                            : nicknameStatus === 'unavailable'
                            ? 'border-red-500'
                            : 'border-gray-300'
                        }`}
                        placeholder="ニックネーム"
                      />
                      {/* ステータスアイコン */}
                      <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                        {nicknameStatus === 'checking' && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                        {nicknameStatus === 'available' && (
                          <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {nicknameStatus === 'unavailable' && (
                          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={handleNicknameUpdate}
                      disabled={updateProfileMutation.isPending || nicknameStatus === 'checking' || nicknameStatus === 'unavailable'}
                      className="px-3 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                    >
                      保存
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingNickname(false);
                        setNewNickname(user.display_name || '');
                        setNicknameStatus(null);
                        setNicknameError('');
                      }}
                      className="px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                    >
                      キャンセル
                    </button>
                  </div>
                  {nicknameError && <p className="text-red-500 text-sm">{nicknameError}</p>}
                  {nicknameStatus === 'available' && !nicknameError && (
                    <p className="text-green-600 text-sm">このニックネームは使用可能です</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <h1 className="text-2xl font-bold">{user.display_name || user.username}</h1>
                  <button
                    onClick={() => setIsEditingNickname(true)}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
            <p className="text-gray-600">@{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* 自己紹介文セクション */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">自己紹介</h2>
          {!isEditingBio && (
            <button
              onClick={() => setIsEditingBio(true)}
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
              title="自己紹介を編集"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
        </div>
        
        {isEditingBio ? (
          <div className="space-y-4">
            <div>
              <textarea
                value={newBio}
                onChange={(e) => setNewBio(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="自己紹介文を入力してください（最大500文字）"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-1">
                <span>最大500文字</span>
                <span>{newBio.length}/500</span>
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveBio}
                disabled={updateBioMutation.isPending}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
              >
                {updateBioMutation.isPending ? '保存中...' : '保存'}
              </button>
              <button
                onClick={() => {
                  setIsEditingBio(false);
                  setNewBio(user?.bio || '');
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
              >
                キャンセル
              </button>
            </div>
          </div>
        ) : (
          <div className="min-h-[60px]">
            {user?.bio ? (
              <p className="text-gray-800 whitespace-pre-wrap">{user.bio}</p>
            ) : (
              <p className="text-gray-500 italic">まだ自己紹介が設定されていません。</p>
            )}
          </div>
        )}
      </div>

      {/* タブナビゲーション */}
      <div className="bg-white rounded-lg shadow-md mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('events')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'events'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              作成したイベント
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              className={`px-6 py-3 font-medium ${
                activeTab === 'comments'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              投稿したコメント
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'events' && (
            <div>
              {eventsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">イベントを読み込み中...</p>
                </div>
              ) : userEvents?.events && userEvents.events.length > 0 ? (
                <div className="space-y-4">
                  {userEvents.events.map((event: Event) => (
                    <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <Link
                              to={`/events/${event.id}`}
                              className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                            >
                              {event.title}
                            </Link>
                            {event.is_public ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                🌐 公開
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                🔒 非公開
                              </span>
                            )}
                          </div>
                          <p className="text-gray-600 mt-1">
                            {new Date(event.start_datetime).toLocaleDateString('ja-JP')}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {event._count?.comments || 0}件のコメント
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Link
                            to={`/events/${event.id}/edit`}
                            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                          >
                            編集
                          </Link>
                          <button
                            onClick={() => handleDeleteEvent(event.id)}
                            disabled={deleteEventMutation.isPending}
                            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                          >
                            削除
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">まだイベントを作成していません</p>
                  <Link
                    to="/register"
                    className="mt-2 inline-block px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    イベントを作成する
                  </Link>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div>
              {commentsLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">コメントを読み込み中...</p>
                </div>
              ) : userComments?.comments && userComments.comments.length > 0 ? (
                <div className="space-y-4">
                  {userComments.comments.map((comment) => (
                    <div key={comment.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <Link
                            to={`/events/${comment.event.id}`}
                            className="text-sm text-blue-600 hover:text-blue-800"
                          >
                            {comment.event.title}
                          </Link>
                          <p className="mt-2 text-gray-800">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(comment.created_at).toLocaleString('ja-JP')}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          disabled={deleteCommentMutation.isPending}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          削除
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600">まだコメントを投稿していません</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};