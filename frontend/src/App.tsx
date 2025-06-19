import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './contexts/ToastContext';
import { AuthProvider } from './contexts/AuthContext';
import { FirebaseAuthProvider } from './contexts/FirebaseAuthContext';
import { Header } from './components/Header';
import { EventListPage } from './pages/EventListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventRegistrationPage } from './pages/EventRegistrationPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { AuthPage } from './pages/AuthPage';
import { AuthCallbackPage } from './pages/AuthCallbackPage';
import { PrivateRoute } from './components/PrivateRoute';

function AppContent() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

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
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
        </Routes>
      </main>
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
