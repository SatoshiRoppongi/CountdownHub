import React, { useState, useEffect } from 'react';
import { useCountdown } from '../hooks/useCountdown';

interface FullscreenCountdownOverlayProps {
  targetDate: string;
  eventTitle: string;
  onFinish?: () => void;
}

export const FullscreenCountdownOverlay: React.FC<FullscreenCountdownOverlayProps> = ({
  targetDate,
  eventTitle,
  onFinish
}) => {
  const { seconds, phase, justFinished } = useCountdown(targetDate, onFinish);
  const [showOverlay, setShowOverlay] = useState(false);
  const [overlayPhase, setOverlayPhase] = useState<'countdown' | 'celebration'>('countdown');

  // 最後の10秒でオーバーレイを表示
  useEffect(() => {
    if (phase === 'final-ten' && seconds > 0) {
      setShowOverlay(true);
      setOverlayPhase('countdown');
    } else if (justFinished) {
      setOverlayPhase('celebration');
      // 3秒後にオーバーレイを非表示
      const timer = setTimeout(() => {
        setShowOverlay(false);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      setShowOverlay(false);
    }
  }, [phase, seconds, justFinished]);

  if (!showOverlay) return null;

  const getCountdownDisplay = () => {
    if (overlayPhase === 'celebration') {
      return (
        <div className="text-center animate-bounce">
          <div className="text-8xl md:text-9xl font-black text-transparent bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 bg-clip-text mb-8">
            START!
          </div>
          <div className="text-4xl md:text-5xl text-white font-bold mb-4">
            🎉 {eventTitle} 🎉
          </div>
          <div className="text-2xl text-white/90">
            イベント開始です！
          </div>
        </div>
      );
    }

    // カウントダウン表示
    return (
      <div className="text-center">
        <div className="mb-8">
          <div className="text-6xl md:text-7xl text-white/80 font-bold mb-4">
            {eventTitle}
          </div>
          <div className="text-2xl md:text-3xl text-white/60">
            開始まであと...
          </div>
        </div>
        
        <div className={`
          transition-all duration-500 transform
          ${seconds <= 3 ? 'scale-150 animate-pulse' : 'scale-100'}
        `}>
          <div className={`
            text-[12rem] md:text-[16rem] font-black leading-none
            ${seconds <= 3 ? 'text-red-400 animate-bounce' : 'text-white'}
            ${seconds === 1 ? 'animate-ping' : ''}
          `}>
            {seconds}
          </div>
        </div>
        
        <div className="text-3xl md:text-4xl text-white/80 font-bold mt-8">
          {seconds === 1 ? '秒後にスタート！' : ''}
        </div>
      </div>
    );
  };

  const getBackgroundAnimation = () => {
    if (overlayPhase === 'celebration') {
      return 'bg-gradient-to-br from-yellow-500 via-red-500 to-pink-600 animate-pulse';
    }
    
    if (seconds <= 3) {
      return 'bg-gradient-to-br from-red-900 via-red-800 to-red-900';
    }
    
    return 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900';
  };

  return (
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        ${getBackgroundAnimation()}
        transition-all duration-1000
      `}
    >
      {/* パーティクル効果（お祝い時） */}
      {overlayPhase === 'celebration' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute text-4xl md:text-6xl animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            >
              {['🎉', '🎊', '✨', '🎈', '🎆'][Math.floor(Math.random() * 5)]}
            </div>
          ))}
        </div>
      )}

      {/* グラデーション波エフェクト */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent transform -skew-x-12 animate-pulse"></div>
      </div>

      {/* メインコンテンツ */}
      <div className="relative z-10 px-8">
        {getCountdownDisplay()}
      </div>

      {/* 音響効果の視覚表現 */}
      {seconds <= 3 && overlayPhase === 'countdown' && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            className={`
              absolute inset-0 border-8 border-white/20 rounded-full
              ${seconds === 3 ? 'animate-ping scale-50' : ''}
              ${seconds === 2 ? 'animate-ping scale-75' : ''}
              ${seconds === 1 ? 'animate-ping scale-100' : ''}
            `}
          ></div>
        </div>
      )}
    </div>
  );
};