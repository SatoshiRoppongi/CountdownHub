import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSocialAuth } from '../hooks/useSocialAuth';
import { useToast } from '../contexts/ToastContext';

export const UserProfileSettings: React.FC = () => {
  const { user } = useAuth();
  const { linkSocialAccount, unlinkSocialAccount, isLoading } = useSocialAuth();
  const { showToast } = useToast();
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">ログインが必要です</p>
      </div>
    );
  }

  const socialProviders = [
    {
      key: 'google',
      name: 'Google',
      icon: '🔍',
      connected: !!user.google_id,
      bgColor: 'bg-red-500 hover:bg-red-600'
    },
    {
      key: 'github',
      name: 'GitHub',
      icon: '🐙',
      connected: !!user.github_id,
      bgColor: 'bg-gray-800 hover:bg-gray-900'
    },
    {
      key: 'twitter',
      name: 'X (Twitter)',
      icon: '𝕏',
      connected: !!user.twitter_id,
      bgColor: 'bg-black hover:bg-gray-800'
    },
    {
      key: 'line',
      name: 'LINE',
      icon: '💬',
      connected: !!user.line_id,
      bgColor: 'bg-green-500 hover:bg-green-600'
    }
  ];

  const handleToggleConnection = async (provider: string, isConnected: boolean) => {
    setIsUpdating(provider);
    
    try {
      if (isConnected) {
        await unlinkSocialAccount(provider);
      } else {
        // 新しい接続の場合は認証ページにリダイレクト
        window.location.href = `${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/${provider}`;
      }
    } catch (error) {
      // エラーは useSocialAuth 内でハンドルされる
    } finally {
      setIsUpdating(null);
    }
  };

  const canDisconnect = (provider: string) => {
    // パスワードがない場合は、最後のソーシャルアカウントは削除できない
    if (!user.auth_provider || user.auth_provider !== 'local') {
      const connectedProviders = socialProviders.filter(p => p.connected).length;
      return connectedProviders > 1;
    }
    return true;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold mb-6">プロフィール設定</h3>

      {/* ユーザー基本情報 */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-16 h-16 rounded-full"
            />
          ) : (
            <div className="w-16 h-16 bg-blue-500 text-white rounded-full flex items-center justify-center text-xl font-medium">
              {user.display_name?.charAt(0) || user.username.charAt(0)}
            </div>
          )}
          <div>
            <h4 className="text-lg font-medium">{user.display_name}</h4>
            <p className="text-gray-600">@{user.username}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
            {user.auth_provider && (
              <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                {user.auth_provider === 'local' ? 'メール認証' : `${user.auth_provider}認証`}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ソーシャルアカウント連携 */}
      <div>
        <h4 className="text-lg font-medium mb-4">ソーシャルアカウント連携</h4>
        <div className="space-y-3">
          {socialProviders.map((provider) => (
            <div
              key={provider.key}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{provider.icon}</span>
                <div>
                  <p className="font-medium">{provider.name}</p>
                  <p className="text-sm text-gray-500">
                    {provider.connected ? '連携済み' : '未連携'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleToggleConnection(provider.key, provider.connected)}
                disabled={
                  isLoading || 
                  isUpdating === provider.key || 
                  (provider.connected && !canDisconnect(provider.key))
                }
                className={`
                  px-4 py-2 rounded-lg font-medium transition-colors
                  ${provider.connected
                    ? canDisconnect(provider.key)
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : `${provider.bgColor} text-white`
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isUpdating === provider.key ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>処理中...</span>
                  </div>
                ) : provider.connected ? (
                  canDisconnect(provider.key) ? '連携解除' : '削除不可'
                ) : (
                  '連携する'
                )}
              </button>
            </div>
          ))}
        </div>

        {/* 注意事項 */}
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>⚠ 注意:</strong> パスワードが設定されていない場合、最後のソーシャルアカウントは削除できません。
            アカウントへのアクセスができなくなる可能性があります。
          </p>
        </div>
      </div>
    </div>
  );
};