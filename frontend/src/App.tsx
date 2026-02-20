/**
 * CountdownHub フロントエンド ルートコンポーネント
 *
 * アプリケーション全体の構造を定義するファイル。
 * プロバイダーの階層構成、ルーティング、グローバルレイアウトを管理する。
 *
 * 主な責務:
 * - プロバイダー階層の構築 (QueryProvider → ToastProvider → FirebaseAuthProvider → AuthProvider → Router → AnalyticsProvider)
 * - React Router v6 によるクライアントサイドルーティングの定義
 * - ヘッダー検索機能と URL パラメータの同期
 * - 認証が必要なルートの保護 (PrivateRoute)
 *
 * プロバイダー階層:
 *   QueryProvider       - TanStack React Query によるサーバーステート管理
 *   └ ToastProvider     - トースト通知の表示管理
 *     └ FirebaseAuthProvider - Firebase Authentication との連携
 *       └ AuthProvider  - アプリケーション独自の認証状態管理
 *         └ Router      - React Router によるルーティング
 *           └ AnalyticsProvider - ページ遷移のアナリティクス追跡
 */

import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';
import { AnalyticsProvider } from './contexts/AnalyticsContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EventListPage } from './pages/EventListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventRegistrationPage } from './pages/EventRegistrationPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ProfilePage } from './pages/ProfilePage';
import { UserProfilePage } from './pages/UserProfilePage';
import { UserFollowersPage } from './pages/UserFollowersPage';
import { UserSearchPage } from './pages/UserSearchPage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { PrivateRoute } from './components/PrivateRoute';

/**
 * AppContent - メインコンテンツ領域のコンポーネント
 *
 * Router 内部に配置され、useLocation / useNavigate を利用する。
 * ヘッダーの検索バーと URL クエリパラメータ (?search=xxx) を双方向で同期し、
 * ページ遷移時に高度検索パネルを閉じる処理も担当する。
 *
 * ルート一覧:
 *   /                      - イベント一覧 (検索・高度検索対応)
 *   /events/:id            - イベント詳細
 *   /register              - イベント登録 (要認証)
 *   /admin                 - 管理画面 (要認証)
 *   /profile               - ユーザープロフィール (要認証)
 *   /users/search           - ユーザー検索
 *   /users/:username        - 公開ユーザープロフィール
 *   /users/:username/followers - フォロワー一覧
 *   /users/:username/following - フォロー中一覧
 *   /login                 - ログイン / 新規登録
 *   /auth/callback         - OAuth コールバック
 *   /terms, /privacy, /contact, /faq - 静的ページ
 */
function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);

  // パス変更時にパネルを閉じる（検索クエリクリアは削除）
  useEffect(() => {
    console.log('🔧 App: path changed to:', location.pathname);
    setShowAdvancedSearch(false);
    
    // 確実にbodyのstyleを完全にクリア
    document.body.style.cssText = '';
    console.log('🔧 App: body style completely cleared');
  }, [location.pathname]);

  // URLパラメータから検索クエリを読み取る（ホームページのみ）
  useEffect(() => {
    if (location.pathname === '/') {
      const searchParams = new URLSearchParams(location.search);
      const searchParam = searchParams.get('search');
      console.log('🔧 App: setting search query from URL:', searchParam);
      setSearchQuery(searchParam || '');
    }
  }, [location.pathname, location.search]);

  const handleSearchChange = useCallback((query: string) => {
    console.log('🔧 App: handleSearchChange called with:', query);
    
    // 他のページから検索した場合のみホームに遷移
    if (location.pathname !== '/' && query.trim()) {
      console.log('🔧 App: navigating to home with search query');
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
      return;
    }
    
    // ホームページでの検索はURLを更新
    if (location.pathname === '/') {
      if (query.trim()) {
        navigate(`/?search=${encodeURIComponent(query.trim())}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [location.pathname, navigate]);

  const handleAdvancedSearch = () => {
    setShowAdvancedSearch(true);
  };

  const handleAdvancedSearchClose = useCallback(() => {
    setShowAdvancedSearch(false);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onAdvancedSearch={handleAdvancedSearch}
      />
      <main>
        <Routes>
          <Route 
            path="/" 
            element={
              <EventListPage 
                searchQuery={searchQuery}
                showAdvancedSearch={showAdvancedSearch}
                onAdvancedSearchClose={handleAdvancedSearchClose}
              />
            } 
          />
          <Route path="/events/:id" element={<EventDetailPage />} />
          <Route path="/register" element={<PrivateRoute><EventRegistrationPage /></PrivateRoute>} />
          <Route path="/admin" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
          <Route path="/users/search" element={<UserSearchPage />} />
          <Route path="/users/:username" element={<UserProfilePage />} />
          <Route path="/users/:username/followers" element={<UserFollowersPage />} />
          <Route path="/users/:username/following" element={<UserFollowersPage />} />
          <Route path="/auth" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/faq" element={<FAQPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

/**
 * App - アプリケーションのルートコンポーネント
 *
 * 全プロバイダーを正しい順序でネストし、AppContent をラップする。
 * プロバイダーの順序は依存関係に基づいて決定されている:
 * 1. QueryProvider: API リクエストのキャッシュ・再取得管理 (他のプロバイダーから利用)
 * 2. ToastProvider: 通知表示 (認証エラー等で利用)
 * 3. FirebaseAuthProvider: Firebase 認証トークン管理
 * 4. AuthProvider: アプリ固有の認証状態 (Firebase 認証に依存)
 * 5. Router: URL ベースのルーティング
 * 6. AnalyticsProvider: ページ遷移追跡 (Router 内でのみ動作)
 */
function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <FirebaseAuthProvider>
          <AuthProvider>
            <Router>
              <AnalyticsProvider>
                <AppContent />
              </AnalyticsProvider>
            </Router>
          </AuthProvider>
        </FirebaseAuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
}

export default App;
