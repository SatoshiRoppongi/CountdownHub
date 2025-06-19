import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LoginForm } from '../components/LoginForm';
import { RegisterForm } from '../components/RegisterForm';

type AuthMode = 'login' | 'register';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<AuthMode>('login');

  // リダイレクト先を取得（デフォルトはホーム）
  const from = (location.state as any)?.from?.pathname || '/';

  const handleAuthSuccess = () => {
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ⏰ カウントダウンハブ
          </h1>
          <p className="text-gray-600">
            {mode === 'login' ? 'アカウントにログイン' : '新しいアカウントを作成'}
          </p>
        </div>

        {mode === 'login' ? (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setMode('register')}
          />
        ) : (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setMode('login')}
          />
        )}

        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            ログインせずに{' '}
            <button
              onClick={() => navigate('/')}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              イベントを閲覧する
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};