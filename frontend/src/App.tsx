import React, { useState, useCallback, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  
  // デバウンス用のタイマー参照
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // パス変更時にパネルを閉じる
  useEffect(() => {
    setShowAdvancedSearch(false);
    setShowSearchHistory(false);
  }, [location.pathname]);

  const handleSearchChange = useCallback((query: string) => {
    // 既存のタイマーをクリア
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // デバウンス処理（300ms後に実行）
    debounceTimerRef.current = setTimeout(() => {
      setSearchQuery(query);
    }, 300);
  }, []);

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
                searchQuery={searchQuery}
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
