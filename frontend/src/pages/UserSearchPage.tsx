import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { userAPI } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { SEOHead } from '../components/SEOHead';

interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  _count: {
    events: number;
    comments: number;
  };
}

interface UserSearchResponse {
  users: SearchUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const UserSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<UserSearchResponse | null>(null);
  const [error, setError] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 検索実行
  const searchUsers = async (query: string, page: number = 1) => {
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await userAPI.searchUsers({
        search: query.trim(),
        page,
        limit: 20
      });
      setSearchResults(response);
    } catch (err: any) {
      console.error('User search error:', err);
      setError('ユーザー検索に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // デバウンスされた検索クエリの変更時に検索実行
  useEffect(() => {
    if (debouncedSearchQuery) {
      searchUsers(debouncedSearchQuery, 1);
      setCurrentPage(1);
      // URLパラメータを更新
      setSearchParams({ q: debouncedSearchQuery });
    } else {
      setSearchResults(null);
      setSearchParams({});
    }
  }, [debouncedSearchQuery, setSearchParams]);

  // ページ変更時の検索
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    if (debouncedSearchQuery) {
      searchUsers(debouncedSearchQuery, page);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSEOData = () => {
    const title = searchQuery 
      ? `"${searchQuery}" の検索結果 - CountdownHub`
      : 'ユーザー検索 - CountdownHub';
    const description = searchQuery
      ? `"${searchQuery}" に関連するユーザーの検索結果です。`
      : 'CountdownHubでユーザーを検索して、興味のあるイベント作成者を見つけましょう。';
    
    return { title, description };
  };

  return (
    <>
      <SEOHead {...getSEOData()} />
      <div className="container mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">👥 ユーザー検索</h1>
          <p className="text-gray-600">
            ユーザー名やニックネームでCountdownHubのユーザーを検索できます
          </p>
        </div>

        {/* 検索フォーム */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ユーザー名またはニックネームで検索..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {isLoading && (
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-2">
            💡 ヒント: ユーザー名（@username）やニックネームで検索できます
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* 検索結果 */}
        {searchResults && (
          <div className="bg-white rounded-lg shadow-md">
            {/* 検索結果ヘッダー */}
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                検索結果: "{debouncedSearchQuery}"
              </h2>
              <p className="text-sm text-gray-600">
                {searchResults.pagination.total}件のユーザーが見つかりました
              </p>
            </div>

            {/* ユーザー一覧 */}
            <div className="divide-y divide-gray-200">
              {searchResults.users.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    該当するユーザーが見つかりませんでした
                  </h3>
                  <p className="text-gray-600">
                    別のキーワードで検索してみてください
                  </p>
                </div>
              ) : (
                searchResults.users.map((user) => (
                  <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-4">
                      {/* アバター */}
                      <div className="flex-shrink-0">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.display_name}
                            className="h-12 w-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-lg font-bold text-gray-600">
                              {user.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* ユーザー情報 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <Link
                            to={`/users/${user.username}`}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-800 truncate"
                          >
                            {user.display_name}
                          </Link>
                          <span className="text-gray-500">@{user.username}</span>
                        </div>
                        
                        {user.bio && (
                          <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                            {user.bio}
                          </p>
                        )}

                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{user._count.events}個のイベント</span>
                          <span>{user._count.comments}個のコメント</span>
                          <span>{formatDate(user.created_at)}から利用開始</span>
                        </div>
                      </div>

                      {/* アクションボタン */}
                      <div className="flex-shrink-0">
                        <Link
                          to={`/users/${user.username}`}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                        >
                          プロフィールを見る
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ページネーション */}
            {searchResults.pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    {((currentPage - 1) * searchResults.pagination.limit) + 1}～
                    {Math.min(currentPage * searchResults.pagination.limit, searchResults.pagination.total)}件 / 
                    {searchResults.pagination.total}件中
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      前へ
                    </button>
                    <span className="px-3 py-2 text-sm font-medium text-gray-700">
                      {currentPage} / {searchResults.pagination.totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === searchResults.pagination.totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      次へ
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 初期状態のメッセージ */}
        {!searchQuery && !searchResults && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              ユーザーを検索してみましょう
            </h2>
            <p className="text-gray-600 mb-6">
              上の検索ボックスにユーザー名やニックネームを入力してください
            </p>
            <div className="text-sm text-gray-500">
              <p>例: "田中", "developer", "react" など</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
};