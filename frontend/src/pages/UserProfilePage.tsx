import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import { EventCard } from '../components/EventCard';
import { SEOHead } from '../components/SEOHead';
import { FollowButton } from '../components/FollowButton';

export const UserProfilePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const [activeTab, setActiveTab] = useState<'events' | 'about'>('events');

  const { data: profileData, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => userAPI.getUserProfile(username!),
    enabled: !!username
  });

  const { data: eventsData, isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ['userEvents', username],
    queryFn: () => userAPI.getUserPublicEvents(username!),
    enabled: !!username && activeTab === 'events'
  });

  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="flex items-center space-x-4 mb-6">
            <div className="h-20 w-20 bg-gray-200 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-6 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (profileError || !profileData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ユーザーが見つかりません
          </h2>
          <p className="text-gray-600 mb-4">
            指定されたユーザーは存在しないか、無効になっている可能性があります。
          </p>
          <Link 
            to="/"
            className="inline-block bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  const user = profileData.user;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSEOData = () => {
    return {
      title: `${user.display_name} (@${user.username}) - CountdownHub`,
      description: `${user.display_name}さんのプロフィールページ。${user._count.events}件のイベントを作成、${user._count.comments}件のコメントを投稿しています。`,
      ogImage: user.avatar_url,
      canonicalUrl: `https://countdown-hub.web.app/users/${user.username}`
    };
  };

  return (
    <>
      <SEOHead {...getSEOData()} />
      <div className="container mx-auto px-4 py-8">
        {/* プロフィールヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start space-x-6">
            {/* アバター */}
            <div className="flex-shrink-0">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.display_name}
                  className="h-20 w-20 rounded-full object-cover"
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-2xl font-bold text-gray-600">
                    {user.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            
            {/* ユーザー情報 */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {user.display_name}
              </h1>
              <p className="text-gray-600 mb-3">@{user.username}</p>
              
              {/* 統計情報 */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                <div>
                  <span className="font-semibold text-gray-900">{user._count.events}</span>
                  <span className="ml-1">イベント</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-900">{user._count.comments}</span>
                  <span className="ml-1">コメント</span>
                </div>
                <Link 
                  to={`/users/${user.username}/followers`}
                  className="hover:text-blue-600 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{user._count.followers}</span>
                  <span className="ml-1">フォロワー</span>
                </Link>
                <Link 
                  to={`/users/${user.username}/following`}
                  className="hover:text-blue-600 transition-colors"
                >
                  <span className="font-semibold text-gray-900">{user._count.following}</span>
                  <span className="ml-1">フォロー中</span>
                </Link>
                <div>
                  <span className="text-gray-500">
                    {formatDate(user.created_at)}から利用開始
                  </span>
                </div>
              </div>
            </div>

            {/* アクションボタン */}
            <div className="flex-shrink-0">
              <FollowButton 
                username={user.username}
                isFollowing={user.isFollowing}
                size="md"
                variant="primary"
              />
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                イベント ({user._count.events})
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'about'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                詳細
              </button>
            </nav>
          </div>

          {/* タブコンテンツ */}
          <div className="p-6">
            {activeTab === 'events' && (
              <div>
                {eventsLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="bg-gray-200 animate-pulse rounded-xl h-80"></div>
                    ))}
                  </div>
                ) : eventsError ? (
                  <div className="text-center py-8">
                    <p className="text-red-600">イベントの取得に失敗しました</p>
                  </div>
                ) : eventsData?.events.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📅</div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      まだイベントがありません
                    </h3>
                    <p className="text-gray-600">
                      {user.display_name}さんはまだイベントを作成していません。
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {eventsData?.events.map((event) => (
                      <EventCard 
                        key={event.id} 
                        event={event}
                        searchTerm=""
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">自己紹介</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    {user.bio ? (
                      <p className="text-gray-800 whitespace-pre-wrap">{user.bio}</p>
                    ) : (
                      <p className="text-gray-600">
                        まだ自己紹介が設定されていません。
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">統計</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{user._count.events}</div>
                      <div className="text-sm text-blue-600">作成イベント</div>
                    </div>
                    <div className="bg-green-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">{user._count.comments}</div>
                      <div className="text-sm text-green-600">コメント数</div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">0</div>
                      <div className="text-sm text-purple-600">フォロワー</div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-orange-600">0</div>
                      <div className="text-sm text-orange-600">フォロー中</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">アカウント情報</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">ユーザー名:</span>
                      <span className="font-medium">@{user.username}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">参加日:</span>
                      <span className="font-medium">{formatDate(user.created_at)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};