import React, { useState, useEffect } from 'react';
import { CountdownTimer } from './CountdownTimer';

interface StickyCountdownHeaderProps {
  targetDate: string;
  eventTitle: string;
  onFinish?: () => void;
}

export const StickyCountdownHeader: React.FC<StickyCountdownHeaderProps> = ({
  targetDate,
  eventTitle,
  onFinish
}) => {
  const [isSticky, setIsSticky] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // 初期のカウントダウンタイマーが画面から消えたらスティッキーを表示
      const initialTimer = document.getElementById('main-countdown-timer');
      if (initialTimer) {
        const rect = initialTimer.getBoundingClientRect();
        setIsSticky(rect.bottom < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${isSticky ? 'transform translate-y-0 opacity-100' : 'transform -translate-y-full opacity-0'}
      `}
    >
      <div className="bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-lg">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 truncate">
                {eventTitle}
              </h2>
            </div>
            <div className="ml-4 flex-shrink-0">
              <CountdownTimer
                targetDate={targetDate}
                size="medium"
                onFinish={onFinish}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};