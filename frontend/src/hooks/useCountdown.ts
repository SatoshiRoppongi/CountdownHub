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
}

export const useCountdown = (targetDate: string | Date, onFinish?: () => void): CountdownTime => {
  const [timeLeft, setTimeLeft] = useState<CountdownTime>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
    totalSeconds: 0,
    phase: 'normal',
    justFinished: false,
  });
  const [wasRunning, setWasRunning] = useState(false);

  const getPhase = useCallback((totalSeconds: number): CountdownPhase => {
    if (totalSeconds <= 0) return 'just-finished';
    if (totalSeconds <= 10) return 'final-ten';
    if (totalSeconds <= 60) return 'final-minute';
    return 'normal';
  }, []);

  useEffect(() => {
    const target = new Date(targetDate).getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = target - now;
      const totalSeconds = Math.floor(difference / 1000);

      if (difference <= 0) {
        // カウントダウン終了
        const justFinished = wasRunning && !timeLeft.isExpired;
        
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isExpired: true,
          totalSeconds: 0,
          phase: 'just-finished',
          justFinished,
        });

        if (justFinished && onFinish) {
          onFinish();
        }
        return;
      }

      setWasRunning(true);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({
        days,
        hours,
        minutes,
        seconds,
        isExpired: false,
        totalSeconds,
        phase: getPhase(totalSeconds),
        justFinished: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate, onFinish, getPhase, wasRunning, timeLeft.isExpired]);

  return timeLeft;
};

export const getUrgencyLevel = (totalSeconds: number): 'critical' | 'urgent' | 'warning' | 'normal' => {
  const hours = totalSeconds / 3600;
  
  if (hours <= 24) return 'critical';
  if (hours <= 72) return 'urgent';  // 3日
  if (hours <= 168) return 'warning'; // 7日
  return 'normal';
};

export const getUrgencyColor = (level: 'critical' | 'urgent' | 'warning' | 'normal'): string => {
  switch (level) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'urgent': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'normal': return 'text-blue-600 bg-blue-50 border-blue-200';
  }
};