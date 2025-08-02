'use client';

import { useAppSelector } from '@/redux/hooks';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

// Error Object Interface
export interface IError {
  message: string;
}

// Redux State Interface
export interface ElementsState {
  actErr: IError | null;
}

const TEN_SECONDS = 10 * 1000;

function Message() {
  const { actErr } = useAppSelector((state) => state.elements);
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [shouldRender, setShouldRender] = useState<boolean>(false);
  const isMounted = useRef<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    isMounted.current = true;

    if (actErr?.message) {
      setShouldRender(true);
      setIsVisible(true);

      if (timeoutRef.current) clearTimeout(timeoutRef.current);

      timeoutRef.current = setTimeout(() => {
        if (isMounted.current) {
          setIsVisible(false);
          // Remove from DOM after fade out (500ms matches your animation)
          setTimeout(() => {
            if (isMounted.current) setShouldRender(false);
          }, 500);
        }
      }, TEN_SECONDS);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        if (isMounted.current) setShouldRender(false);
      }, 500);
    }

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [actErr]);

  if (!actErr || !actErr.message || !shouldRender) return null;

  return (
    <div
      className={`fixed top-5 right-5 md:right-10 z-50 w-full max-w-sm
        bg-red-100 text-red-900 border-l-4 border-red-500 px-5 py-4 rounded-md shadow-lg
        flex items-center gap-4
        transition-opacity duration-500 ease-in-out
        ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Image src="/icons/error.svg" width={24} height={24} alt="Error Icon" className="w-6 h-6" />
      </div>

      {/* Message Content */}
      <div className="flex-1">
        <h2 className="font-bold text-lg">Something went wrong</h2>
        <p className="text-sm">{actErr.message}</p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-full"
        aria-label="Close Toast"
      >
        ✖️
      </button>
    </div>
  );
}

export default Message;
