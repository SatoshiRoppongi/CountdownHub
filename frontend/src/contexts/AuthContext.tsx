import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url?: string;
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
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  }, [fetchUserProfile]);

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // トークンが無効な場合はログアウト
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ログインに失敗しました');
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('countdown_hub_token', data.token);

    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, username: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          username,
          password,
          display_name: displayName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'ユーザー登録に失敗しました');
      }

      setUser(data.user);
      setToken(data.token);
      localStorage.setItem('countdown_hub_token', data.token);

    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('countdown_hub_token');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
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