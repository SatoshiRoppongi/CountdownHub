import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../services/api';
import { User } from '../types';
import { useToast } from '../contexts/ToastContext';

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const { showSuccess, showError } = useToast();

  const limit = 20;

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers({
        page: currentPage,
        limit,
        search: searchQuery || undefined
      });
      setUsers(response.users);
      setTotalPages(response.pagination.totalPages);
      setTotal(response.pagination.total);
    } catch (error) {
      showError('ユーザー一覧の取得に失敗しました');
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchQuery, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const handleStatusToggle = async (userId: string, field: 'is_active' | 'is_admin', currentValue: boolean) => {
    try {
      await adminAPI.updateUserStatus(userId, {
        [field]: !currentValue
      });
      
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, [field]: !currentValue }
          : user
      ));
      
      showSuccess('ユーザーステータスを更新しました');
    } catch (error) {
      showError('ユーザーステータスの更新に失敗しました');
      console.error('Failed to update user status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
        isActive 
          ? 'bg-green-100 text-green-800' 
          : 'bg-red-100 text-red-800'
      }`}>
        {isActive ? 'アクティブ' : '無効'}
      </span>
    );
  };

  const getAdminBadge = (isAdmin: boolean) => {
    return isAdmin ? (
      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
        管理者
      </span>
    ) : null;
  };

  const getProviderBadge = (provider: string) => {
    const colors = {
      local: 'bg-gray-100 text-gray-800',
      google: 'bg-red-100 text-red-800',
      twitter: 'bg-blue-100 text-blue-800',
      github: 'bg-gray-900 text-white',
      line: 'bg-green-100 text-green-800'
    };

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[provider as keyof typeof colors] || colors.local}`}>
        {provider}
      </span>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ユーザー管理</h1>
        <p className="text-gray-600">
          全{total}人のユーザーを管理できます
        </p>
      </div>

      {/* 検索フォーム */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="ユーザー名、表示名、メールアドレスで検索..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            検索
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              クリア
            </button>
          )}
        </form>
      </div>

      {/* ユーザー一覧 */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ユーザー
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  認証方法
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  統計
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  登録日
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.avatar_url ? (
                          <img
                            className="h-10 w-10 rounded-full"
                            src={user.avatar_url}
                            alt={user.display_name}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {user.display_name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.display_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          @{user.username}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(user.is_active || false)}
                      {getAdminBadge(user.is_admin || false)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getProviderBadge(user.auth_provider || 'local')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>イベント: {user._count?.events || 0}件</div>
                    <div>コメント: {user._count?.comments || 0}件</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex flex-col gap-2">
                      <Link
                        to={`/admin/users/${user.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        詳細表示
                      </Link>
                      <button
                        onClick={() => handleStatusToggle(user.id, 'is_active', user.is_active || false)}
                        className={`text-left ${
                          user.is_active 
                            ? 'text-red-600 hover:text-red-900' 
                            : 'text-green-600 hover:text-green-900'
                        }`}
                      >
                        {user.is_active ? '無効化' : '有効化'}
                      </button>
                      <button
                        onClick={() => handleStatusToggle(user.id, 'is_admin', user.is_admin || false)}
                        className={`text-left ${
                          user.is_admin 
                            ? 'text-orange-600 hover:text-orange-900' 
                            : 'text-purple-600 hover:text-purple-900'
                        }`}
                      >
                        {user.is_admin ? '管理者解除' : '管理者設定'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ページネーション */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                前へ
              </button>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                次へ
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {((currentPage - 1) * limit) + 1} - {Math.min(currentPage * limit, total)} 件目
                  （全 {total} 件中）
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    前へ
                  </button>
                  
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === pageNum
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    次へ
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {users.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 text-lg">
            {searchQuery ? '検索条件に一致するユーザーが見つかりませんでした' : 'ユーザーが見つかりませんでした'}
          </div>
        </div>
      )}
    </div>
  );
};