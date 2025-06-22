import React from 'react';
import { useAdmin as useAdminCheck } from '../hooks/useAdmin';

export const AdminDashboard: React.FC = () => {
  const { isAdmin, isLoading: adminLoading, error: adminError } = useAdminCheck();

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
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-green-800 mb-4">管理者ダッシュボード</h1>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
          <p className="text-green-700">
            ✅ 管理者権限が確認されました。管理機能にアクセスできます。
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">イベント管理</h3>
            <p className="text-blue-600 text-sm mb-3">すべてのイベントの管理と統計</p>
            <p className="text-blue-500 text-sm">実装予定</p>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">ユーザー管理</h3>
            <p className="text-yellow-600 text-sm mb-3">ユーザーアカウントの管理</p>
            <p className="text-yellow-500 text-sm">実装予定</p>
          </div>
          
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">システム設定</h3>
            <p className="text-purple-600 text-sm mb-3">アプリケーション設定</p>
            <p className="text-purple-500 text-sm">実装予定</p>
          </div>
        </div>
      </div>
    </div>
  );
};