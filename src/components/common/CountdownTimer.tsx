'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  expiryDate: string | Date;
  onExpire?: () => void;
  className?: string;
  showLabels?: boolean;
}

export default function CountdownTimer({ 
  expiryDate, 
  onExpire, 
  className = '', 
  showLabels = true 
}: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<{ minutes: number; seconds: number } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(expiryDate).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft({ minutes: 0, seconds: 0 });
        if (onExpire) onExpire();
        return false;
      }

      setTimeLeft({
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60)
      });
      return true;
    };

    const hasTimeLeft = calculateTimeLeft();
    if (!hasTimeLeft) return;

    const timer = setInterval(() => {
      const stillHasTime = calculateTimeLeft();
      if (!stillHasTime) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiryDate, onExpire]);

  if (!timeLeft) return null;

  const isCritical = timeLeft.minutes < 5;

  return (
    <div className={`d-inline-flex align-items-center font-monospace fw-bold ${isCritical ? 'text-danger' : 'text-primary'} ${className}`}>
      <div className="bg-light border rounded px-2 py-1 me-1 shadow-sm">
        {timeLeft.minutes.toString().padStart(2, '0')}
        {showLabels && <span style={{ fontSize: '0.6rem' }} className="d-block text-muted text-uppercase text-center">Min</span>}
      </div>
      <span className="fs-4">:</span>
      <div className="bg-light border rounded px-2 py-1 ms-1 shadow-sm">
        {timeLeft.seconds.toString().padStart(2, '0')}
        {showLabels && <span style={{ fontSize: '0.6rem' }} className="d-block text-muted text-uppercase text-center">Sec</span>}
      </div>
    </div>
  );
}
