import React, { createContext, useContext, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView } from '../utils/googleAnalytics';

interface AnalyticsContextType {
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;
  trackCustomEvent: (action: string, category?: string, label?: string, value?: number) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    initGA();
  }, []);

  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  const contextValue: AnalyticsContextType = {
    trackEvent: (eventName: string, parameters?: Record<string, any>) => {
      const { trackEvent } = require('../utils/googleAnalytics');
      trackEvent(eventName, parameters);
    },
    trackCustomEvent: (action: string, category?: string, label?: string, value?: number) => {
      const { trackCustomEvent } = require('../utils/googleAnalytics');
      trackCustomEvent(action, category, label, value);
    },
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      {children}
    </AnalyticsContext.Provider>
  );
};