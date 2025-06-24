import { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EventListPage } from './pages/EventListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventRegistrationPage } from './pages/EventRegistrationPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { ProfilePage } from './pages/ProfilePage';
import { TermsOfServicePage } from './pages/TermsOfServicePage';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage';
import { ContactPage } from './pages/ContactPage';
import { FAQPage } from './pages/FAQPage';
import { PrivateRoute } from './components/PrivateRoute';

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

function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <FirebaseAuthProvider>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </FirebaseAuthProvider>
      </ToastProvider>
    </QueryProvider>
  );
}

export default App;
