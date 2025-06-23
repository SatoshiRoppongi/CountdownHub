import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAdmin } from '../hooks/useAdmin';
import { useToast } from '../contexts/ToastContext';
import { AnnouncementBell } from './AnnouncementBell';

interface HeaderProps {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onAdvancedSearch?: () => void;
  onSearchHistory?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  searchQuery = '', 
  onSearchChange,
  onAdvancedSearch,
  onSearchHistory
}) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin } = useAdmin();
  const { showToast } = useToast();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Google OAuthログイン成功の検知
  useEffect(() => {
    const loginSuccess = sessionStorage.getItem('login_success');
    if (loginSuccess && user) {
      showToast({
        type: 'success',
        title: 'ログイン成功',
        message: loginSuccess
      });
      sessionStorage.removeItem('login_success');
    }
  }, [user, showToast]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearchQuery);
    }
  };

  const handleSearchChange = useCallback((value: string) => {
    setLocalSearchQuery(value);
    
    // 既存のタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // デバウンス処理（300ms後に実行）
    debounceTimerRef.current = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(value);
      }
    }, 300);
  }, [onSearchChange]);

  return (
    <header className="bg-white shadow-md border-b">
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* ロゴ・サイト名 */}
          <div className="flex items-center flex-shrink-0 min-w-0">
            <Link to="/" className="flex items-center space-x-1 sm:space-x-2 hover:opacity-80 transition-opacity">
              <span className="text-xl sm:text-2xl flex-shrink-0">⏰</span>
              <span className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 whitespace-nowrap truncate">カウントダウンハブ</span>
            </Link>
          </div>

          {/* 検索バー - デスクトップのみ表示 */}
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
            <div className="flex items-center space-x-3 w-full">
              <form onSubmit={handleSearchSubmit} className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={localSearchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="イベントを検索..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </form>
              
              {/* 検索関連ボタン */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onAdvancedSearch}
                  className="inline-flex items-center px-3 py-2 text-sm text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                  title="高度な検索"
                >
                  🔍
                </button>
                <button
                  type="button"
                  onClick={onSearchHistory}
                  className="inline-flex items-center px-3 py-2 text-sm text-purple-600 border border-purple-600 rounded-lg hover:bg-purple-50 transition-colors"
                  title="検索履歴"
                >
                  📚
                </button>
              </div>
            </div>
          </div>

          {/* モバイル検索アイコン */}
          <div className="lg:hidden flex items-center flex-shrink-0">
            <button
              onClick={() => setIsMobileSearchOpen(true)}
              className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title="検索"
            >
              <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>

          {/* ナビゲーションメニュー */}
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4 flex-shrink-0">
            {user ? (
              <>
                <Link
                  to="/register"
                  className="bg-blue-500 text-white px-1.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap"
                >
                  <span className="hidden lg:inline">+ イベント登録</span>
                  <span className="lg:hidden">登録</span>
                </Link>
                
                {/* 通知ベル */}
                <AnnouncementBell />
                
                {/* ユーザーメニュー */}
                <div className="relative">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
                  >
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">
                      {user.display_name?.charAt(0) || user.username?.charAt(0) || '?'}
                    </div>
                    <span className="hidden lg:block text-sm truncate max-w-20">{user.display_name || user.username || 'ユーザー'}</span>
                    <svg className={`w-3 h-3 sm:w-4 sm:h-4 transition-transform flex-shrink-0 ${isUserMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isUserMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                      <Link
                        to="/profile"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        プロフィール
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          管理画面
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          logout();
                          setIsUserMenuOpen(false);
                          navigate('/');
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        ログアウト
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap"
                >
                  ログイン
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-500 text-white px-1.5 sm:px-3 lg:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-blue-600 transition-colors font-medium text-xs sm:text-sm lg:text-base whitespace-nowrap"
                >
                  <span className="hidden lg:inline">+ イベント登録</span>
                  <span className="lg:hidden">登録</span>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* モバイル検索オーバーレイ */}
      {isMobileSearchOpen && (
        <div className="lg:hidden fixed inset-0 bg-white z-50 flex flex-col">
          {/* 検索ヘッダー */}
          <div className="flex items-center p-4 border-b border-gray-200">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900 transition-colors mr-3"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <form onSubmit={(e) => {
              handleSearchSubmit(e);
              setIsMobileSearchOpen(false);
            }} className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  value={localSearchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="イベントを検索..."
                  className="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </form>
          </div>
          
          {/* 検索オプション */}
          <div className="p-4 space-y-3">
            <button
              onClick={() => {
                if (onAdvancedSearch) onAdvancedSearch();
                setIsMobileSearchOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔍</span>
                <span className="font-medium text-gray-900">高度な検索</span>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={() => {
                if (onSearchHistory) onSearchHistory();
                setIsMobileSearchOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <span className="text-2xl">📚</span>
                <span className="font-medium text-gray-900">検索履歴</span>
              </div>
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {/* 検索のヒント */}
          <div className="p-4 mt-auto border-t border-gray-200">
            <div className="text-sm text-gray-600">
              <p className="mb-2 font-medium">検索のヒント:</p>
              <ul className="space-y-1 text-xs">
                <li>• イベント名、場所、タグで検索できます</li>
                <li>• スペースで区切ると複数キーワード検索</li>
                <li>• 日付や開催形式でも絞り込み可能</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};