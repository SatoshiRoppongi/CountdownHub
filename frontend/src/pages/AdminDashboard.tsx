import React, { useState } from 'react';
import { useAdmin as useAdminCheck } from '../hooks/useAdmin';
import { AnnouncementManagement } from '../components/AnnouncementManagement';
import { AdminUsersPage } from './AdminUsersPage';
import EventCSVImport from '../components/EventCSVImport';

export const AdminDashboard: React.FC = () => {
  const { isAdmin, isLoading: adminLoading, error: adminError } = useAdminCheck();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'events' | 'users' | 'announcements'>('dashboard');

  // ローディング中
  if (adminLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">管理者権限を確認中...</p>
        </div>
      </div>
    );
  }

  // 管理者権限がない場合
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-800 mb-4">アクセス拒否</h1>
          <p className="text-red-700 mb-4">
            管理者ダッシュボードにアクセスする権限がありません。
          </p>
          <p className="text-red-600 text-sm">
            一般ユーザーはセルフサインアップで作成されたアカウントのため、管理機能にはアクセスできません。
          </p>
          {adminError && (
            <p className="text-red-500 text-sm mt-2">
              エラー: {adminError}
            </p>
          )}
        </div>
      </div>
    );
  }

  // 管理者の場合は基本的な管理ダッシュボードを表示
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="p-6 pb-0">
            <h1 className="text-2xl font-bold text-green-800 mb-4">管理者ダッシュボード</h1>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-700">
                ✅ 管理者権限が確認されました。管理機能にアクセスできます。
              </p>
            </div>
          </div>
          
          {/* タブナビゲーション */}
          <div className="px-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ダッシュボード
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                イベント管理
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                ユーザー管理
              </button>
              <button
                onClick={() => setActiveTab('announcements')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'announcements'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                お知らせ管理
              </button>
            </nav>
          </div>
        </div>

        {/* タブコンテンツ */}
        <div className="p-6">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">イベント管理</h3>
                <p className="text-blue-600 text-sm mb-3">CSVによる一括登録と管理</p>
                <button
                  onClick={() => setActiveTab('events')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  管理画面へ →
                </button>
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">ユーザー管理</h3>
                <p className="text-yellow-600 text-sm mb-3">ユーザーアカウントの管理</p>
                <button
                  onClick={() => setActiveTab('users')}
                  className="text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                >
                  管理画面へ →
                </button>
              </div>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="font-semibold text-red-800 mb-2">お知らせ管理</h3>
                <p className="text-red-600 text-sm mb-3">サイト全体のお知らせ管理</p>
                <button
                  onClick={() => setActiveTab('announcements')}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  管理画面へ →
                </button>
              </div>
              
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">システム設定</h3>
                <p className="text-purple-600 text-sm mb-3">アプリケーション設定</p>
                <p className="text-purple-500 text-sm">実装予定</p>
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">イベント管理</h2>
                <p className="text-gray-600 mb-6">
                  CSVファイルによるイベントの一括登録ができます。大量のイベントデータを効率的にインポートできます。
                </p>
              </div>
              
              <EventCSVImport />
            </div>
          )}

          {activeTab === 'users' && (
            <AdminUsersPage />
          )}

          {activeTab === 'announcements' && (
            <AnnouncementManagement />
          )}
        </div>
      </div>
    </div>
  );
};