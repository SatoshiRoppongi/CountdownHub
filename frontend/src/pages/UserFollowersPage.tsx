import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { userAPI } from '../services/api';
import { SEOHead } from '../components/SEOHead';
import { FollowButton } from '../components/FollowButton';

type TabType = 'followers' | 'following';

export const UserFollowersPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>('followers');
  const [page, setPage] = useState(1);
  const limit = 20;

  // URLパスに基づいてアクティブタブを設定
  useEffect(() => {
    if (location.pathname.includes('/following')) {
      setActiveTab('following');
    } else {
      setActiveTab('followers');
    }
  }, [location.pathname]);

  const { data: profileData } = useQuery({
    queryKey: ['userProfile', username],
    queryFn: () => userAPI.getUserProfile(username!),
    enabled: !!username
  });

  const { data: followersData, isLoading: followersLoading } = useQuery({
    queryKey: ['userFollowers', username, page],
    queryFn: () => userAPI.getUserFollowers(username!, { page, limit }),
    enabled: !!username && activeTab === 'followers'
  });

  const { data: followingData, isLoading: followingLoading } = useQuery({
    queryKey: ['userFollowing', username, page],
    queryFn: () => userAPI.getUserFollowing(username!, { page, limit }),
    enabled: !!username && activeTab === 'following'
  });


  if (!username || !profileData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">👤</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ユーザーが見つかりません
          </h2>
          <p className="text-gray-600 mb-6">
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
  const currentData = activeTab === 'followers' ? followersData : followingData;
  const isLoading = activeTab === 'followers' ? followersLoading : followingLoading;
  const users = activeTab === 'followers' 
    ? followersData?.followers || [] 
    : followingData?.following || [];

  const getSEOData = () => {
    const tabName = activeTab === 'followers' ? 'フォロワー' : 'フォロー中';
    return {
      title: `${user.display_name}の${tabName} - CountdownHub`,
      description: `${user.display_name}さんの${tabName}一覧を表示しています。`,
      canonicalUrl: `https://countdown-hub.web.app/users/${user.username}/${activeTab}`
    };
  };

  return (
    <>
      <SEOHead {...getSEOData()} />
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Link
              to={`/users/${username}`}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← {user.display_name}のプロフィールに戻る
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user.display_name}の{activeTab === 'followers' ? 'フォロワー' : 'フォロー中'}
          </h1>
        </div>

        {/* タブナビゲーション */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <Link
              to={`/users/${username}/followers`}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'followers'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              フォロワー ({user._count.followers})
            </Link>
            <Link
              to={`/users/${username}/following`}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'following'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              フォロー中 ({user._count.following})
            </Link>
          </nav>
        </div>

        {/* ユーザー一覧 */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-lg shadow p-4">
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                  </div>
                  <div className="h-8 w-20 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {activeTab === 'followers' ? 'フォロワーがいません' : 'フォロー中のユーザーがいません'}
            </h3>
            <p className="text-gray-600">
              {activeTab === 'followers' 
                ? 'まだ誰もフォローしていません。' 
                : 'まだ誰もフォローしていません。'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((followUser) => (
              <div key={followUser.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/users/${followUser.username}`}
                    className="flex items-center space-x-4 flex-1 hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                  >
                    {/* アバター */}
                    {followUser.avatar_url ? (
                      <img
                        src={followUser.avatar_url}
                        alt={followUser.display_name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-lg font-bold text-gray-600">
                          {followUser.display_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    
                    {/* ユーザー情報 */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {followUser.display_name}
                      </h3>
                      <p className="text-gray-600 text-sm truncate">
                        @{followUser.username}
                      </p>
                      {followUser.bio && (
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {followUser.bio}
                        </p>
                      )}
                      <div className="flex space-x-4 text-xs text-gray-500 mt-1">
                        <span>{followUser._count.followers} フォロワー</span>
                        <span>{followUser._count.following} フォロー中</span>
                      </div>
                    </div>
                  </Link>
                  
                  {/* フォローボタン */}
                  <div className="ml-4">
                    <FollowButton 
                      username={followUser.username}
                      isFollowing={false} // TODO: 実際のフォロー状態を取得
                      size="sm"
                      variant="secondary"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ページネーション */}
        {currentData && currentData.pagination.totalPages > 1 && (
          <div className="flex justify-center items-center space-x-4 mt-8">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              前へ
            </button>
            
            <span className="text-sm text-gray-600">
              ページ {page} / {currentData.pagination.totalPages}
            </span>
            
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= currentData.pagination.totalPages}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              次へ
            </button>
          </div>
        )}
      </div>
    </>
  );
};