import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

export const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const token = searchParams.get('token');
      const provider = searchParams.get('provider');
      const error = searchParams.get('error');

      if (error) {
        let errorMessage = 'ソーシャルログインに失敗しました';
        switch (error) {
          case 'oauth_error':
            errorMessage = 'OAuth認証でエラーが発生しました';
            break;
          case 'oauth_failed':
            errorMessage = 'OAuth認証が失敗しました';
            break;
          case 'token_error':
            errorMessage = 'トークンの生成に失敗しました';
            break;
        }
        showToast({
          type: 'error',
          title: '認証エラー',
          message: errorMessage
        });
        navigate('/auth');
        return;
      }

      if (token && provider) {
        try {
          // トークンをlocalStorageに保存
          localStorage.setItem('countdown_hub_token', token);
          
          // ユーザー情報を取得
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:3001'}/api/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.ok) {
            await response.json(); // ユーザー情報を取得（AuthContextが自動更新）
            showToast({
              type: 'success',
              title: 'ログイン成功',
              message: `${provider}アカウントでログインしました`
            });
            
            // リダイレクト先を取得（デフォルトはホーム）
            const from = sessionStorage.getItem('auth_redirect') || '/';
            sessionStorage.removeItem('auth_redirect');
            navigate(from, { replace: true });
          } else {
            throw new Error('ユーザー情報の取得に失敗しました');
          }
        } catch (error) {
          console.error('Auth callback error:', error);
          showToast({
            type: 'error',
            title: '認証エラー',
            message: '認証処理に失敗しました'
          });
          localStorage.removeItem('countdown_hub_token');
          navigate('/auth');
        }
      } else {
        showToast({
          type: 'error',
          title: '認証エラー',
          message: '認証情報が不正です'
        });
        navigate('/auth');
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, showToast]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">認証処理中...</p>
        <p className="text-sm text-gray-500 mt-2">しばらくお待ちください</p>
      </div>
    </div>
  );
};