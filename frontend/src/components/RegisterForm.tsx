import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { authAPI } from '../services/api';

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [, setDisplayNameChecking] = useState(false);
  const [displayNameStatus, setDisplayNameStatus] = useState<'available' | 'unavailable' | 'checking' | null>(null);
  const { register, isLoading } = useAuth();
  const { showToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // ニックネーム入力時にリアルタイムチェック状態をリセット
    if (name === 'displayName') {
      setDisplayNameStatus(null);
    }
  };

  // ニックネーム重複チェック（デバウンス付き）
  const checkDisplayNameAvailability = useCallback(
    async (displayName: string) => {
      if (!displayName.trim() || displayName.trim().length === 0) {
        setDisplayNameStatus(null);
        return;
      }

      if (displayName.trim().length > 100) {
        setDisplayNameStatus('unavailable');
        setErrors(prev => ({ ...prev, displayName: 'ニックネームは100文字以下で入力してください' }));
        return;
      }

      setDisplayNameChecking(true);
      setDisplayNameStatus('checking');
      
      try {
        const result = await authAPI.checkDisplayNameAvailability(displayName.trim());
        setDisplayNameStatus(result.available ? 'available' : 'unavailable');
        
        if (!result.available) {
          setErrors(prev => ({ ...prev, displayName: result.message }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.displayName;
            return newErrors;
          });
        }
      } catch (error) {
        console.error('Display name check error:', error);
        setDisplayNameStatus(null);
      } finally {
        setDisplayNameChecking(false);
      }
    },
    []
  );

  // デバウンス処理
  useEffect(() => {
    if (!formData.displayName.trim()) {
      setDisplayNameStatus(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      checkDisplayNameAvailability(formData.displayName);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [formData.displayName, checkDisplayNameAvailability]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // メールアドレス
    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // ユーザー名
    if (!formData.username.trim()) {
      newErrors.username = 'ユーザー名を入力してください';
    } else if (formData.username.length < 3) {
      newErrors.username = 'ユーザー名は3文字以上で入力してください';
    } else if (formData.username.length > 50) {
      newErrors.username = 'ユーザー名は50文字以下で入力してください';
    } else if (!/^[a-zA-Z0-9_-]+$/.test(formData.username)) {
      newErrors.username = 'ユーザー名は英数字、アンダースコア、ハイフンのみ使用可能です';
    }

    // パスワード
    if (!formData.password.trim()) {
      newErrors.password = 'パスワードを入力してください';
    } else if (formData.password.length < 8) {
      newErrors.password = 'パスワードは8文字以上で入力してください';
    } else if (formData.password.length > 100) {
      newErrors.password = 'パスワードは100文字以下で入力してください';
    }

    // パスワード確認
    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'パスワード確認を入力してください';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'パスワードが一致しません';
    }

    // 表示名
    if (formData.displayName.trim()) {
      if (formData.displayName.length > 100) {
        newErrors.displayName = 'ニックネームは100文字以下で入力してください';
      } else if (displayNameStatus === 'unavailable') {
        newErrors.displayName = 'このニックネームは既に使用されています。異なるニックネームを設定してください。';
      } else if (displayNameStatus === 'checking') {
        newErrors.displayName = 'ニックネームを確認中です...';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      await register(
        formData.email,
        formData.username,
        formData.password,
        formData.displayName || undefined
      );
      onSuccess?.();
    } catch (error) {
      console.error('Registration error:', error);
      if (error instanceof Error) {
        showToast({
          type: 'error',
          title: '登録エラー',
          message: error.message
        });
      } else {
        showToast({
          type: 'error',
          title: '登録エラー',
          message: 'ユーザー登録に失敗しました'
        });
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6">新規登録</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
              errors.email ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="example@email.com"
            disabled={isLoading}
          />
          {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
            ユーザー名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
              errors.username ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="username123"
            disabled={isLoading}
          />
          {errors.username && <p className="text-red-500 text-sm mt-1">{errors.username}</p>}
          <p className="text-gray-500 text-xs mt-1">3-50文字、英数字・アンダースコア・ハイフンのみ</p>
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
            ニックネーム（任意）
          </label>
          <div className="relative">
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleChange}
              className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                errors.displayName 
                  ? 'border-red-500 focus:ring-red-500' 
                  : displayNameStatus === 'available'
                  ? 'border-green-500 focus:ring-green-500'
                  : displayNameStatus === 'unavailable'
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="山田太郎"
              disabled={isLoading}
            />
            {/* ステータスアイコン */}
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              {displayNameStatus === 'checking' && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
              {displayNameStatus === 'available' && (
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
              {displayNameStatus === 'unavailable' && (
                <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
          </div>
          {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName}</p>}
          {displayNameStatus === 'available' && !errors.displayName && (
            <p className="text-green-600 text-sm mt-1">このニックネームは使用可能です</p>
          )}
          <p className="text-gray-500 text-xs mt-1">空の場合は自動で「UserXXXXXX」が設定されます</p>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
              errors.password ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
          <p className="text-gray-500 text-xs mt-1">8文字以上</p>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード確認 <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${ 
              errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="••••••••"
            disabled={isLoading}
          />
          {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? '登録中...' : 'アカウント作成'}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className="text-center mt-4">
          <p className="text-gray-600">
            既にアカウントをお持ちの方は{' '}
            <button
              onClick={onSwitchToLogin}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              ログイン
            </button>
          </p>
        </div>
      )}
    </div>
  );
};