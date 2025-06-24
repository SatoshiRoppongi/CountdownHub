import React, { useState, useEffect } from 'react';
import { useCountdown, getUrgencyLevel, getUrgencyColor } from '../hooks/useCountdown';

interface CountdownTimerProps {
  targetDate: string;
  endDate?: string;
  size?: 'small' | 'medium' | 'large';
  showExpired?: boolean;
  textColor?: 'white' | 'default';
  onFinish?: () => void;
}

export const CountdownTimer: React.FC<CountdownTimerProps> = ({ 
  targetDate, 
  endDate,
  size = 'medium',
  showExpired = true,
  textColor = 'default',
  onFinish
}) => {
  const { days, hours, minutes, seconds, isExpired, totalSeconds, phase, justFinished, isRunning } = useCountdown(targetDate, endDate, onFinish);
  
  const [showCelebration, setShowCelebration] = useState(false);


  // 経過時間をフォーマットする関数
  const formatElapsedTime = (days: number, hours: number, minutes: number, seconds: number) => {
    if (days > 0) {
      return `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`;
    } else if (hours > 0) {
      return `${hours}時間 ${minutes}分 ${seconds}秒`;
    } else {
      return `${minutes}分 ${seconds}秒`;
    }
  };

  // justFinishedが true の時のみアニメーション表示
  useEffect(() => {
    if (justFinished) {
      setShowCelebration(true);
      const timer = setTimeout(() => setShowCelebration(false), 3000);
      return () => clearTimeout(timer);
    } else {
      setShowCelebration(false);
    }
  }, [justFinished]);
  
  const getSizeClasses = () => {
    const baseSize = {
      small: 'text-sm',
      medium: 'text-lg', 
      large: 'text-2xl md:text-3xl'
    };

    // 最終段階では文字サイズを大きくする
    if (phase === 'final-ten') {
      return {
        small: 'text-lg font-black',
        medium: 'text-2xl font-black',
        large: 'text-4xl md:text-6xl font-black'
      };
    }
    if (phase === 'final-minute') {
      return {
        small: 'text-base font-bold',
        medium: 'text-xl font-bold',
        large: 'text-3xl md:text-4xl font-bold'
      };
    }
    
    return baseSize;
  };

  const sizeClasses = getSizeClasses();

  const containerClasses = {
    small: 'p-2',
    medium: 'p-3',
    large: 'p-4 md:p-6'
  };

  // 終了済みイベント（カウントアップ表示）
  if (isExpired && !isRunning && !showCelebration) {
    return showExpired ? (
      <div className={`
        rounded-lg border-2 font-mono font-bold text-center transition-all duration-300
        ${textColor === 'white' ? 'text-white border-white/30' : 'text-gray-700 border-gray-300 bg-gray-50'}
        ${containerClasses[size]}
      `}>
        <div className={`${sizeClasses[size]} leading-tight`}>
          終了から {formatElapsedTime(days, hours, minutes, seconds)}
        </div>
      </div>
    ) : null;
  }

  // 開催中イベント（二重表示：開始からのカウントアップ＋終了までのカウントダウン）
  if (isExpired && isRunning && !showCelebration && endDate) {
    const now = new Date().getTime();
    const startTime = new Date(targetDate).getTime();
    const endTime = new Date(endDate).getTime();
    
    // 開始からの経過時間
    const elapsedMs = now - startTime;
    const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
    const elapsedHours = Math.floor((elapsedMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const elapsedMinutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
    const elapsedSeconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);
    
    // 終了までの残り時間
    const remainingMs = endTime - now;
    const remainingDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
    const remainingHours = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const remainingMinutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
    const remainingSecondsValue = Math.floor((remainingMs % (1000 * 60)) / 1000);

    return showExpired ? (
      <div className={`
        rounded-lg border-2 font-mono font-bold text-center transition-all duration-300
        ${textColor === 'white' ? 'text-white border-white/30' : 'text-green-700 border-green-300 bg-green-50'}
        ${containerClasses[size]}
      `}>
        <div className="flex flex-col space-y-1">
          <div className={`${sizeClasses[size]} leading-tight text-green-600`}>
            ⏰ 開催中
          </div>
          <div className="text-xs font-normal space-y-1">
            <div className="text-blue-600">
              📈 開始から: {formatElapsedTime(elapsedDays, elapsedHours, elapsedMinutes, elapsedSeconds)}
            </div>
            <div className="text-orange-600">
              📉 終了まで: {formatElapsedTime(remainingDays, remainingHours, remainingMinutes, remainingSecondsValue)}
            </div>
          </div>
        </div>
      </div>
    ) : null;
  }

  // 開催中イベント（終了日時なしの場合は従来通り）
  if (isExpired && isRunning && !showCelebration && !endDate) {
    return showExpired ? (
      <div className={`
        rounded-lg border-2 font-mono font-bold text-center transition-all duration-300
        ${textColor === 'white' ? 'text-white border-white/30' : 'text-green-700 border-green-300 bg-green-50'}
        ${containerClasses[size]}
      `}>
        <div className={`${sizeClasses[size]} leading-tight`}>
          開催中 {formatElapsedTime(days, hours, minutes, seconds)}
        </div>
      </div>
    ) : null;
  }

  const urgencyLevel = getUrgencyLevel(totalSeconds);
  const colorClasses = getUrgencyColor(urgencyLevel);
  
  const getAnimationClasses = (): string => {
    // 開催中イベントはアニメーションなし
    if (isExpired && isRunning) {
      return '';
    }
    
    switch (phase) {
      case 'final-ten':
        return 'animate-bounce text-red-600 scale-125 drop-shadow-lg';
      case 'final-minute':
        return 'animate-pulse scale-110 text-red-500';
      case 'just-finished':
        return 'animate-ping text-green-500 scale-150';
      default:
        return urgencyLevel === 'critical' ? 'animate-pulse' : '';
    }
  };

  const formatTime = () => {
    if (phase === 'final-ten') {
      // 最後の10秒は秒数のみ大きく表示
      return `${seconds}`;
    }
    if (phase === 'final-minute' && days === 0 && hours === 0) {
      // 最後の1分は分:秒形式
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    if (days > 0) {
      return `${days}日 ${hours}時間 ${minutes}分 ${seconds}秒`;
    } else if (hours > 0) {
      return `${hours}時間 ${minutes}分 ${seconds}秒`;
    } else {
      return `${minutes}分 ${seconds}秒`;
    }
  };

  const getTextColorClasses = () => {
    if (textColor === 'white') {
      return 'text-white border-white/30';
    }
    if (phase === 'final-ten' || phase === 'final-minute') {
      return 'text-red-600 border-red-300 bg-red-50';
    }
    return colorClasses;
  };

  // お祝いアニメーション
  if (showCelebration) {
    return (
      <div className="relative">
        <div className="absolute inset-0 animate-ping bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-lg opacity-20"></div>
        <div className={`
          rounded-lg border-2 font-mono font-bold text-center relative z-10
          bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 text-white
          ${containerClasses[size]} animate-bounce
        `}>
          <div className="text-2xl md:text-4xl leading-tight">
            🎉 START! 🎉
          </div>
          <div className="text-xs mt-2 opacity-90 font-normal animate-pulse">
            イベント開始です！
          </div>
        </div>
        {/* 紙吹雪エフェクト */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          {[...Array(10)].map((_, i) => (
            <div
              key={i}
              className={`absolute animate-ping text-2xl`}
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
              }}
            >
              🎊
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`
      rounded-lg border-2 font-mono font-bold text-center transition-all duration-300
      ${getTextColorClasses()}
      ${containerClasses[size]}
      ${getAnimationClasses()}
    `}>
      <div className={`${sizeClasses[size]} leading-tight`}>
        {formatTime()}
      </div>
      {size === 'large' && phase !== 'final-ten' && (
        <div className="text-xs mt-1 opacity-75 font-normal">
          {phase === 'final-minute' && '🚨 残り1分を切りました！'}
          {phase === 'normal' && urgencyLevel === 'critical' && '🚨 まもなく開始'}
          {phase === 'normal' && urgencyLevel === 'urgent' && '⚡ 開始間近'}
          {phase === 'normal' && urgencyLevel === 'warning' && '⏰ 今週開催'}
          {phase === 'normal' && urgencyLevel === 'normal' && '📅 開催予定'}
        </div>
      )}
      {phase === 'final-ten' && (
        <div className="text-sm mt-2 animate-pulse font-bold text-red-700">
          秒後にスタート！
        </div>
      )}
    </div>
  );
};