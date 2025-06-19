import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { QueryProvider } from './providers/QueryProvider';
import { ToastProvider } from './contexts/ToastContext';
import { Header } from './components/Header';
import { EventListPage } from './pages/EventListPage';
import { EventDetailPage } from './pages/EventDetailPage';
import { EventRegistrationPage } from './pages/EventRegistrationPage';
import { AdminDashboard } from './pages/AdminDashboard';

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
          <Route path="/register" element={<EventRegistrationPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryProvider>
      <ToastProvider>
        <Router>
          <AppContent />
        </Router>
      </ToastProvider>
    </QueryProvider>
  );
}

export default App;
