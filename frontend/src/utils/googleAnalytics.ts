import ReactGA from 'react-ga4';

const MEASUREMENT_ID = process.env.REACT_APP_GA_MEASUREMENT_ID;

// デバッグ用：環境変数の確認
console.log('Environment check:', {
  NODE_ENV: process.env.NODE_ENV,
  MEASUREMENT_ID: MEASUREMENT_ID ? `${MEASUREMENT_ID.substring(0, 5)}...` : 'NOT_FOUND',
  ALL_GA_VARS: Object.keys(process.env).filter(key => key.includes('GA'))
});

export const initGA = () => {
  if (MEASUREMENT_ID) {
    ReactGA.initialize(MEASUREMENT_ID);
    console.log('Google Analytics initialized with ID:', MEASUREMENT_ID);
  } else {
    console.warn('Google Analytics Measurement ID not found in environment variables');
  }
};

export const trackPageView = (path: string, title?: string) => {
  if (MEASUREMENT_ID) {
    ReactGA.send({
      hitType: 'pageview',
      page: path,
      title: title || document.title,
    });
    console.log('GA: Page view tracked:', path);
  }
};

export const trackEvent = (eventName: string, parameters?: Record<string, any>) => {
  if (MEASUREMENT_ID) {
    ReactGA.event(eventName, parameters);
    console.log('GA: Event tracked:', eventName, parameters);
  }
};

export const trackCustomEvent = (action: string, category?: string, label?: string, value?: number) => {
  if (MEASUREMENT_ID) {
    ReactGA.event({
      action,
      category: category || 'General',
      label,
      value,
    });
    console.log('GA: Custom event tracked:', { action, category, label, value });
  }
};