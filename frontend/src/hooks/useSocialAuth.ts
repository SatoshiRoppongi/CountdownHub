import { useState } from 'react';
import { useToast } from '../contexts/ToastContext';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export const useSocialAuth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const startSocialLogin = (provider: string) => {
    setIsLoading(true);
    
    try {
      // サポートされているプロバイダーをチェック
      const supportedProviders = ['google', 'github', 'twitter', 'line'];
      if (!supportedProviders.includes(provider)) {
        throw new Error('サポートされていないプロバイダーです');
      }

      // プロバイダー固有の認証URLを構築
      let authUrl = '';
      switch (provider) {
        case 'google':
          authUrl = `${API_BASE_URL}/api/auth/google`;
          break;
        case 'github':
          authUrl = `${API_BASE_URL}/api/auth/github`;
          break;
        case 'twitter':
          authUrl = `${API_BASE_URL}/api/auth/twitter`;
          break;
        case 'line':
          authUrl = `${API_BASE_URL}/api/auth/line`;
          break;
        default:
          throw new Error('サポートされていないプロバイダーです');
      }

      // 新しいウィンドウで認証を開始
      window.location.href = authUrl;

    } catch (error) {
      console.error('Social login error:', error);
      showToast({
        type: 'error',
        title: 'ソーシャルログインエラー',
        message: error instanceof Error ? error.message : 'ソーシャルログインに失敗しました'
      });
      setIsLoading(false);
    }
  };

  const linkSocialAccount = async (provider: string, providerId: string) => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('countdown_hub_token');
      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/link-social`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider,
          provider_id: providerId
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウント連携に失敗しました');
      }

      showToast({
        type: 'success',
        title: 'アカウント連携',
        message: data.message
      });
      return data.user;

    } catch (error) {
      console.error('Link social account error:', error);
      showToast({
        type: 'error',
        title: 'アカウント連携エラー',
        message: error instanceof Error ? error.message : 'アカウント連携に失敗しました'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unlinkSocialAccount = async (provider: string) => {
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('countdown_hub_token');
      if (!token) {
        throw new Error('認証が必要です');
      }

      const response = await fetch(`${API_BASE_URL}/api/auth/unlink-social`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ provider })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'アカウント連携解除に失敗しました');
      }

      showToast({
        type: 'success',
        title: 'アカウント連携解除',
        message: data.message
      });
      return data.user;

    } catch (error) {
      console.error('Unlink social account error:', error);
      showToast({
        type: 'error',
        title: 'アカウント連携解除エラー',
        message: error instanceof Error ? error.message : 'アカウント連携解除に失敗しました'
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    startSocialLogin,
    linkSocialAccount,
    unlinkSocialAccount,
    isLoading
  };
};