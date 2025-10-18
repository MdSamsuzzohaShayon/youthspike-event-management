'use client';

import { useAppSelector } from '@/redux/hooks';
import Image from 'next/image';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EMessage } from '@/types';

const TEN_SECONDS = 10 * 1000;

function Message() {
  const message = useAppSelector((state) => state.elements.message);
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Map design per message type
  const typeConfig = useMemo(() => {
    switch (message?.type) {
      case EMessage.SUCCESS:
        return {
          bg: 'bg-green-100',
          text: 'text-green-900',
          border: 'border-green-500',
          icon: '/icons/success.svg',
          title: 'Success!',
        };
      case EMessage.WARN:
        return {
          bg: 'bg-yellow-100',
          text: 'text-yellow-900',
          border: 'border-yellow-500',
          icon: '/icons/warning.svg',
          title: 'Warning!',
        };
      case EMessage.INFO:
        return {
          bg: 'bg-blue-100',
          text: 'text-blue-900',
          border: 'border-blue-500',
          icon: '/icons/info.svg',
          title: 'Information',
        };
      case EMessage.ERROR:
      default:
        return {
          bg: 'bg-red-100',
          text: 'text-red-900',
          border: 'border-red-500',
          icon: '/icons/error.svg',
          title: message?.name || 'Something went wrong',
        };
    }
  }, [message?.type]);

  useEffect(() => {
    if (message?.message) {
      setIsVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, TEN_SECONDS);
    } else {
      setIsVisible(false);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [message]);

  if (!message?.message) return null;

  return (
    <div
      className={`fixed top-5 right-5 md:right-10 z-50 w-full max-w-sm px-5 py-4 rounded-md shadow-lg
        flex items-center gap-4 border-l-4 transition-all duration-500 ease-in-out transform
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'}
        ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}
      `}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <Image src={typeConfig.icon} width={24} height={24} alt="Status Icon" className="w-6 h-6" />
      </div>

      {/* Message Content */}
      <div className="flex-1">
        <h2 className="font-bold text-lg">{typeConfig.title}</h2>
        <p className="text-sm">{message.message}</p>
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => setIsVisible(false)}
        className="text-xl font-bold hover:opacity-70 focus:outline-none"
        aria-label="Close Toast"
      >
        ✖
      </button>
    </div>
  );
}

export default Message;
