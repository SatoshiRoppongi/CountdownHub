import { useState, useEffect, useRef } from 'react';

export type CountdownPhase = 'normal' | 'final-minute' | 'final-ten' | 'just-finished';

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSeconds: number;
  phase: CountdownPhase;
  justFinished: boolean;
  isRunning: boolean;
  elapsedSeconds: number;
}

// 純粋関数として外部定義（依存配列に含まれない）
const getPhase = (totalSeconds: number): CountdownPhase => {
  if (totalSeconds <= 0) return 'just-finished';
  if (totalSeconds <= 10) return 'final-ten';
  if (totalSeconds <= 60) return 'final-minute';
  return 'normal';
};

const calculateTime = (ms: number) => {
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
};

export const useCountdown = (startDate: string | Date, endDate?: string | Date, onFinish?: () => void): CountdownTime => {
  // 初期状態の判定（マウント時の状態を正確に把握）
  const getInitialState = (): CountdownTime => {
    const now = new Date().getTime();
    const startTime = new Date(startDate).getTime();
    const endTime = endDate ? new Date(endDate).getTime() : null;
    const diff = startTime - now;

    // 開始前
    if (diff > 0) {
      const { days, hours, minutes, seconds } = calculateTime(diff);
      return {
        days, hours, minutes, seconds,
        isExpired: false,
        totalSeconds: Math.floor(diff / 1000),
        phase: getPhase(Math.floor(diff / 1000)),
        justFinished: false,
        isRunning: false,
        elapsedSeconds: 0,
      };
    }

    // 開催中
    if (endTime && now >= startTime && now < endTime) {
      const elapsed = now - startTime;
      const { days, hours, minutes, seconds } = calculateTime(elapsed);
      return {
        days, hours, minutes, seconds,
        isExpired: true,
        totalSeconds: 0,
        phase: 'normal', // 開催中は通常フェーズ
        justFinished: false, // 既に開催中なので絶対にfalse
        isRunning: true,
        elapsedSeconds: Math.floor(elapsed / 1000),
      };
    }

    // 終了済み
    if (endTime && now >= endTime) {
      const elapsed = now - endTime;
      const { days, hours, minutes, seconds } = calculateTime(elapsed);
      return {
        days, hours, minutes, seconds,
        isExpired: true,
        totalSeconds: 0,
        phase: 'normal', // 終了済みは通常フェーズ
        justFinished: false, // 既に終了済みなので絶対にfalse
        isRunning: false,
        elapsedSeconds: Math.floor(elapsed / 1000),
      };
    }

    // 開始済み（終了日なし）
    const elapsed = Math.max(0, now - startTime);
    const { days, hours, minutes, seconds } = calculateTime(elapsed);
    return {
      days, hours, minutes, seconds,
      isExpired: true,
      totalSeconds: 0,
      phase: 'normal', // 開始済みは通常フェーズ
      justFinished: false, // 既に開始済みなので絶対にfalse
      isRunning: false,
      elapsedSeconds: Math.floor(elapsed / 1000),
    };
  };

  const [timeLeft, setTimeLeft] = useState<CountdownTime>(() => getInitialState());
  
  // 安定化のためのref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevHasStartedRef = useRef<boolean | null>(null); // 前回の開始状態を記録
  const justFinishedTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 日付が変わったらリセット
    prevHasStartedRef.current = null; // 前回開始状態をリセット
    if (justFinishedTimer.current) {
      clearTimeout(justFinishedTimer.current);
      justFinishedTimer.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const newState = getInitialState();
    setTimeLeft(newState);
  }, [startDate, endDate, getInitialState]);

  useEffect(() => {
    const tick = () => {
      const now = new Date().getTime();
      const startTime = new Date(startDate).getTime();
      const endTime = endDate ? new Date(endDate).getTime() : null;
      const diff = startTime - now;
      
      // 開始時刻を過ぎたかどうか
      const hasStarted = diff <= 0;
      
      // 前回は開始していなかったが今回開始した場合
      const prevHasStarted = prevHasStartedRef.current;
      const justStarted = prevHasStarted === false && hasStarted === true;
      
      // デバッグログ
      if (Math.abs(diff) < 10000) { // 開始時刻の前後10秒
        console.log('Start debug:', {
          diff,
          hasStarted,
          prevHasStarted,
          justStarted
        });
      }
      
      // 前回の開始状態を更新
      prevHasStartedRef.current = hasStarted;
      
      if (justStarted) {
        console.log('🎉 Animation triggered! START!');
        
        // onFinish実行
        if (onFinish) {
          try {
            onFinish();
          } catch (error) {
            console.error('Error in onFinish callback:', error);
          }
        }

        // アニメーション開始
        setTimeLeft(prev => ({
          ...prev,
          isExpired: true,
          justFinished: true,
          isRunning: endTime ? now < endTime : false,
        }));

        // 3秒後にアニメーション終了
        if (justFinishedTimer.current) {
          clearTimeout(justFinishedTimer.current);
        }
        justFinishedTimer.current = setTimeout(() => {
          console.log('Animation ended');
          setTimeLeft(prev => ({ ...prev, justFinished: false }));
        }, 3000);
        
        return;
      }

      // 開始前（カウントダウン中）
      if (diff > 0) {
        const { days, hours, minutes, seconds } = calculateTime(diff);
        const currentTotalSeconds = Math.floor(diff / 1000);
        
        setTimeLeft({
          days, hours, minutes, seconds,
          isExpired: false,
          totalSeconds: currentTotalSeconds,
          phase: getPhase(currentTotalSeconds),
          justFinished: false,
          isRunning: false,
          elapsedSeconds: 0,
        });
        return;
      }

      // 開催中
      if (endTime && now >= startTime && now < endTime) {
        const elapsed = now - startTime;
        const { days, hours, minutes, seconds } = calculateTime(elapsed);
        setTimeLeft(prev => ({
          days, hours, minutes, seconds,
          isExpired: true,
          totalSeconds: 0,
          phase: 'normal',
          justFinished: prev.justFinished, // アニメーション中は維持
          isRunning: true,
          elapsedSeconds: Math.floor(elapsed / 1000),
        }));
        return;
      }

      // 終了済み
      if (endTime && now >= endTime) {
        const elapsed = now - endTime;
        const { days, hours, minutes, seconds } = calculateTime(elapsed);
        setTimeLeft({
          days, hours, minutes, seconds,
          isExpired: true,
          totalSeconds: 0,
          phase: 'normal',
          justFinished: false,
          isRunning: false,
          elapsedSeconds: Math.floor(elapsed / 1000),
        });
        return;
      }

      // 開始済み（終了日なし）
      const elapsed = Math.max(0, now - startTime);
      const { days, hours, minutes, seconds } = calculateTime(elapsed);
      setTimeLeft(prev => ({
        days, hours, minutes, seconds,
        isExpired: true,
        totalSeconds: 0,
        phase: 'normal',
        justFinished: prev.justFinished, // アニメーション中は維持
        isRunning: false,
        elapsedSeconds: Math.floor(elapsed / 1000),
      }));
    };

    tick(); // 初回実行
    intervalRef.current = setInterval(tick, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (justFinishedTimer.current) {
        clearTimeout(justFinishedTimer.current);
        justFinishedTimer.current = null;
      }
    };
  }, [startDate, endDate, onFinish]); // onFinishを依存配列に追加

  return timeLeft;
};

export type UrgencyLevel = 'normal' | 'warning' | 'urgent' | 'critical';

export const getUrgencyLevel = (totalSeconds: number): UrgencyLevel => {
  if (totalSeconds <= 0) return 'critical';
  if (totalSeconds <= 3600) return 'critical'; // 1時間以内
  if (totalSeconds <= 86400) return 'urgent'; // 1日以内
  if (totalSeconds <= 604800) return 'warning'; // 1週間以内
  return 'normal';
};

export const getUrgencyColor = (urgencyLevel: UrgencyLevel): string => {
  switch (urgencyLevel) {
    case 'critical':
      return 'text-red-600 border-red-300 bg-red-50';
    case 'urgent':
      return 'text-orange-600 border-orange-300 bg-orange-50';
    case 'warning':
      return 'text-yellow-600 border-yellow-300 bg-yellow-50';
    default:
      return 'text-blue-600 border-blue-300 bg-blue-50';
  }
};