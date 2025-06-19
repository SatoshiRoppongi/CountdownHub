import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'celebration';
  title: string;
  message: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // 入場アニメーション
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (toast.duration !== -1) {
      const timer = setTimeout(() => {
        handleClose();
      }, toast.duration || 5000);
      return () => clearTimeout(timer);
    }
  }, [toast.duration, handleClose]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(toast.id);
    }, 300);
  };

  const getToastStyles = () => {
    const baseStyles = "relative overflow-hidden rounded-lg shadow-lg p-4 max-w-sm w-full transition-all duration-300 transform";
    
    switch (toast.type) {
      case 'celebration':
        return `${baseStyles} bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white`;
      case 'success':
        return `${baseStyles} bg-green-500 text-white`;
      case 'info':
        return `${baseStyles} bg-blue-500 text-white`;
      case 'warning':
        return `${baseStyles} bg-yellow-500 text-white`;
      case 'error':
        return `${baseStyles} bg-red-500 text-white`;
      default:
        return `${baseStyles} bg-gray-800 text-white`;
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'celebration':
        return '🎉';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '📢';
    }
  };

  return (
    <div
      className={`
        ${getToastStyles()}
        ${isVisible && !isLeaving ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      {/* 背景アニメーション（お祝い用） */}
      {toast.type === 'celebration' && (
        <div className="absolute inset-0 opacity-20">
          <div className="animate-ping absolute top-2 left-2 w-2 h-2 bg-white rounded-full"></div>
          <div className="animate-ping absolute top-4 right-4 w-1 h-1 bg-white rounded-full" style={{ animationDelay: '0.5s' }}></div>
          <div className="animate-ping absolute bottom-3 left-8 w-1.5 h-1.5 bg-white rounded-full" style={{ animationDelay: '1s' }}></div>
        </div>
      )}
      
      <div className="flex items-start space-x-3 relative z-10">
        <div className="flex-shrink-0">
          <span className="text-xl">{getIcon()}</span>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm leading-tight mb-1">
            {toast.title}
          </div>
          <div className="text-sm opacity-90">
            {toast.message}
          </div>
        </div>
        
        <button
          onClick={handleClose}
          className="flex-shrink-0 ml-2 text-white/70 hover:text-white transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* プログレスバー */}
      {toast.duration !== -1 && (
        <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
          <div 
            className="h-full bg-white/60 transition-all linear animate-pulse"
            style={{ 
              width: '0%',
              animation: `linear ${toast.duration || 5000}ms`,
              animationFillMode: 'forwards'
            }}
          />
        </div>
      )}
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onClose }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map(toast => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
};