import React, { useState, useCallback, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  // パス変更時にパネルを閉じ、検索関連のクエリをクリア
  useEffect(() => {
    setShowAdvancedSearch(false);
    setShowSearchHistory(false);
    
    // ホームページ以外に遷移した場合、検索関連のクエリをクリア
    if (location.pathname !== '/') {
      queryClient.removeQueries({ queryKey: ['events'] });
    }
  }, [location.pathname, queryClient]);

  // URLパラメータから検索クエリを読み取る
  useEffect(() => {
    if (location.pathname === '/') {
      const searchParams = new URLSearchParams(location.search);
      const searchParam = searchParams.get('search');
      setSearchQuery(searchParam || '');
    } else {
      // 他のページに移動した場合は検索クエリを即座にクリア
      setSearchQuery('');
    }
  }, [location.pathname, location.search]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    
    // 詳細ページまたは他のページから検索した場合は一覧ページに遷移
    if (location.pathname !== '/' && query.trim()) {
      navigate(`/?search=${encodeURIComponent(query.trim())}`);
    }
  }, [location.pathname, navigate]);

  const handleAdvancedSearch = () => {
    setShowAdvancedSearch(true);
  };

  const handleSearchHistory = () => {
    setShowSearchHistory(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onAdvancedSearch={handleAdvancedSearch}
        onSearchHistory={handleSearchHistory}
      />
      <main>
        <Routes>
          <Route 
            path="/" 
            element={
              <EventListPage 
                searchQuery={location.pathname === '/' ? searchQuery : ''}
                showAdvancedSearch={showAdvancedSearch}
                showSearchHistory={showSearchHistory}
                onAdvancedSearchClose={() => setShowAdvancedSearch(false)}
                onSearchHistoryClose={() => setShowSearchHistory(false)}
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
