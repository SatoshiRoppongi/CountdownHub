import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastContainer } from '../components/Toast';

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  showEventStarted: (eventTitle: string) => void;
  showToast: (toast: Omit<ToastMessage, 'id'>) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 11);
    const newToast: ToastMessage = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showEventStarted = useCallback((eventTitle: string) => {
    addToast({
      type: 'celebration',
      title: 'イベント開始！',
      message: `「${eventTitle}」が開始されました！🎉`,
      duration: 8000, // 少し長めに表示
    });
  }, [addToast]);

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    addToast(toast);
  }, [addToast]);

  const showSuccess = useCallback((message: string) => {
    addToast({
      type: 'success',
      title: '成功',
      message,
      duration: 4000,
    });
  }, [addToast]);

  const showError = useCallback((message: string) => {
    addToast({
      type: 'error',
      title: 'エラー',
      message,
      duration: 6000,
    });
  }, [addToast]);

  const contextValue: ToastContextType = {
    addToast,
    removeToast,
    showEventStarted,
    showToast,
    showSuccess,
    showError,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
};