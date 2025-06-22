import { useState, useEffect, useCallback } from 'react';

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
  isRunning: boolean; // 開催中かどうか
  elapsedSeconds: number; // 経過時間（秒）
}

export const useCountdown = (startDate: string | Date, endDate?: string | Date, onFinish?: () => void): CountdownTime => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSeconds: 0,
    phase: 'normal',
    justFinished: false,
    isRunning: false,
    elapsedSeconds: 0,
  });
  const [wasRunning, setWasRunning] = useState(false);

  const getPhase = useCallback((totalSeconds: number): CountdownPhase => {
    if (totalSeconds <= 0) return 'just-finished';
    if (totalSeconds <= 10) return 'final-ten';
    if (totalSeconds <= 60) return 'final-minute';
    return 'normal';
  }, []);

  useEffect(() => {
    const startTime = new Date(startDate).getTime();
    const endTime = endDate ? new Date(endDate).getTime() : null;
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const startDifference = startTime - now;
      const startTotalSeconds = Math.floor(startDifference / 1000);

      // イベント開始前
      if (startDifference > 0) {
        setWasRunning(true);

        const days = Math.floor(startDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((startDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((startDifference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((startDifference % (1000 * 60)) / 1000);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isExpired: false,
          totalSeconds: startTotalSeconds,
          phase: getPhase(startTotalSeconds),
          justFinished: false,
          isRunning: false,
          elapsedSeconds: 0,
        });
        return;
      }

      // イベント開始時
      if (!timeLeft.isExpired && wasRunning && startDifference <= 0) {
        const justFinished = true;
        
        setTimeLeft(prev => ({
          ...prev,
          isExpired: true,
          phase: 'just-finished',
          justFinished,
          isRunning: !endTime || (endTime && now < endTime),
        }));

        if (justFinished && onFinish) {
          onFinish();
        }
        return;
      }

      // イベント開催中
      if (endTime && now >= startTime && now < endTime) {
        const elapsedMs = now - startTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        const days = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((elapsedMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isExpired: true,
          totalSeconds: 0,
          phase: 'just-finished',
          justFinished: false,
          isRunning: true,
          elapsedSeconds,
        });
        return;
      }

      // イベント終了後
      if (endTime && now >= endTime) {
        const elapsedMs = now - endTime;
        const elapsedSeconds = Math.floor(elapsedMs / 1000);
        
        const days = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((elapsedMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((elapsedMs % (1000 * 60)) / 1000);

        setTimeLeft({
          days,
          hours,
          minutes,
          seconds,
          isExpired: true,
          totalSeconds: 0,
          phase: 'just-finished',
          justFinished: false,
          isRunning: false,
          elapsedSeconds,
        });
        return;
      }

      // イベント開始したが終了日が設定されていない場合
      setTimeLeft({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        totalSeconds: 0,
        phase: 'just-finished',
        justFinished: false,
        isRunning: false,
        elapsedSeconds: now - startTime > 0 ? Math.floor((now - startTime) / 1000) : 0,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [startDate, endDate, onFinish, getPhase, timeLeft.isExpired, wasRunning]);

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