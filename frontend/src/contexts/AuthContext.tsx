import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  auth_provider?: string;
  google_id?: string;
  github_id?: string;
  twitter_id?: string;
  line_id?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, username: string, password: string, displayName?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  updateUser: (userData: User) => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001'; // authAPIを使用するため不要

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const data = await authAPI.getProfile();
      setUser(data.user);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // 無効なトークンの場合、削除
      localStorage.removeItem('countdown_hub_token');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  // トークンをlocalStorageから復元
  useEffect(() => {
    const savedToken = localStorage.getItem('countdown_hub_token');
    if (savedToken) {
      setToken(savedToken);
      // トークンからユーザー情報を取得
      fetchUserProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await authAPI.login({ email, password });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('countdown_hub_token', data.token);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'ログインに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const data = await authAPI.register({
        email,
        username,
        password,
        display_name: displayName
      });
      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('countdown_hub_token', data.token);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'ユーザー登録に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('countdown_hub_token');
  };

  const refreshUser = async () => {
    if (token) {
      await fetchUserProfile(token);
    }
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    refreshUser,
    updateUser,
    isLoading,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};