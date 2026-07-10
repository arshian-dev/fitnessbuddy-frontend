import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const timerRef = useRef(null);

  const startTimer = (seconds) => {
    setSecondsLeft(seconds);
    setIsActive(true);
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setIsActive(false);
          // Play a sound here if we had one
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const stopTimer = () => {
    setIsActive(false);
    setSecondsLeft(0);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const addTime = (seconds) => {
    setSecondsLeft((prev) => prev + seconds);
  };

  const subtractTime = (seconds) => {
    setSecondsLeft((prev) => Math.max(0, prev - seconds));
  };

  return (
    <TimerContext.Provider value={{ secondsLeft, isActive, startTimer, stopTimer, addTime, subtractTime }}>
      {children}
      {/* Global Timer UI */}
      {isActive && (
        <div className="fixed bottom-0 left-0 right-0 bg-primary text-on-primary p-sm text-center shadow-lg flex justify-center items-center gap-md z-50 animate-in slide-in-from-bottom">
          <span className="font-bold">Rest Timer: {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}</span>
          <button onClick={() => subtractTime(15)} className="px-xs py-1 bg-white/20 hover:bg-white/30 rounded text-xs">-15s</button>
          <button onClick={() => addTime(15)} className="px-xs py-1 bg-white/20 hover:bg-white/30 rounded text-xs">+15s</button>
          <button onClick={stopTimer} className="px-xs py-1 bg-white/20 hover:bg-white/30 rounded text-xs font-bold text-red-100">Skip</button>
        </div>
      )}
    </TimerContext.Provider>
  );
}

export const useTimer = () => useContext(TimerContext);
