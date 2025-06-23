import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { SocialLoginButton } from './SocialLoginButton';
import { useSocialAuth } from '../hooks/useSocialAuth';

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess, onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const { login, isLoading } = useAuth();
  const { showToast } = useToast();
  const { startSocialLogin, isLoading: isSocialLoading } = useSocialAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // バリデーション
    const newErrors: { [key: string]: string } = {};
    if (!email.trim()) newErrors.email = 'メールアドレスを入力してください';
    if (!password.trim()) newErrors.password = 'パスワードを入力してください';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(email, password);
      onSuccess?.();
    } catch (error) {
      console.error('Login error:', error);
      showToast({
        type: 'error',
        title: 'ログインエラー',
        message: error instanceof Error ? error.message : 'ログインに失敗しました'
      });
    }
  };

  const handleSocialLogin = (provider: string) => {
    // 認証ページからのソーシャルログインの場合はホームページにリダイレクト
    sessionStorage.setItem('auth_redirect', '/');
    startSocialLogin(provider);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">ログイン</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="example@email.com"
            disabled={isLoading}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading || isSocialLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      {/* 区切り線 */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">または</span>
        </div>
      </div>

      {/* ソーシャルログインボタン */}
      <div className="space-y-3">
        <SocialLoginButton
          provider="google"
          onLogin={handleSocialLogin}
          disabled={isLoading || isSocialLoading}
        />
        <SocialLoginButton
          provider="twitter"
          onLogin={handleSocialLogin}
          disabled={isLoading || isSocialLoading}
        />
        {/* 他のプロバイダーは今後追加 */}
        {/* 
        <SocialLoginButton
          provider="github"
          onLogin={handleSocialLogin}
          disabled={isLoading || isSocialLoading}
        />
        <SocialLoginButton
          provider="line"
          onLogin={handleSocialLogin}
          disabled={isLoading || isSocialLoading}
        />
        */}
      </div>

      {onSwitchToRegister && (
        <div className="text-center mt-4">
          <p className="text-gray-600">
            アカウントをお持ちでない方は{' '}
            <button
              onClick={onSwitchToRegister}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              新規登録
            </button>
          </p>
        </div>
      )}
    </div>
  );
};