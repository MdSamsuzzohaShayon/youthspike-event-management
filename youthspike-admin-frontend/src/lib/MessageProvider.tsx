'use client';

import { IMessage } from '@/types';
import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';


export interface MessageContextType {
  message: IMessage | null;
  setMessage: (message: IMessage | null) => void;
  showMessage: (message: Omit<IMessage, 'id'>) => void;
  clearMessage: () => void;
}

// Create the context
const MessageContext = createContext<MessageContextType | undefined>(undefined);

// Custom hook for consuming the context
export const useMessage = (): MessageContextType => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useMessage must be used within a MessageProvider');
  }
  return context;
};

// Toast Component
const MessageToast: React.FC<{ message: IMessage; onClose: () => void }> = ({ message, onClose }) => {
  useEffect(() => {
    if (message.duration !== 0) {
      const timer = setTimeout(() => {
        onClose();
      }, message.duration || 5000);

      return () => clearTimeout(timer);
    }
  }, [message.duration, onClose]);

  const getTypeStyles = (): string => {
    switch (message.type) {
      case 'success':
        return 'bg-green-50 border-green-400 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-400 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-400 text-yellow-800';
      case 'info':
        return 'bg-blue-50 border-blue-400 text-blue-800';
      default:
        return 'bg-gray-50 border-gray-400 text-gray-800';
    }
  };

  const getIcon = (): string => {
    switch (message.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  const getIconStyles = (): string => {
    switch (message.type) {
      case 'success':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      case 'warning':
        return 'text-yellow-400';
      case 'info':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div
      className={`fixed top-4 right-4 z-50 max-w-sm w-full sm:w-96 animate-slide-in-right`}
      role="alert"
    >
      <div
        className={`rounded-lg border-l-4 shadow-lg p-4 ${getTypeStyles()} backdrop-blur-sm bg-opacity-95`}
      >
        <div className="flex items-start">
          <div className={`flex-shrink-0 text-lg font-bold mr-3 ${getIconStyles()}`}>
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium break-words">
              {message.message || `${message.type.charAt(0).toUpperCase() + message.type.slice(1)}`}
            </p>
            {message.code && (
              <p className="text-xs opacity-75 mt-1">Code: {message.code}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 text-gray-400 hover:text-gray-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400 rounded-lg p-1"
            aria-label="Close"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// Provider Component
interface MessageProviderProps {
  children: ReactNode;
}

export const MessageProvider: React.FC<MessageProviderProps> = ({ children }) => {
  const [message, setMessage] = useState<IMessage | null>(null);

  const showMessage = useCallback((newMessage: Omit<IMessage, 'id'>) => {
    const messageWithId: IMessage = {
      ...newMessage,
      id: Math.random().toString(36).substring(2, 9),
      duration: newMessage.duration ?? 5000,
    };
    setMessage(messageWithId);
  }, []);

  const clearMessage = useCallback(() => {
    setMessage(null);
  }, []);

  return (
    <MessageContext.Provider
      value={{
        message,
        setMessage,
        showMessage,
        clearMessage,
      }}
    >
      {children}
      {message && (
        <MessageToast
          key={message.id}
          message={message}
          onClose={clearMessage}
        />
      )}
    </MessageContext.Provider>
  );
};

// Add this to your global CSS file or tailwind.config.js
const styles = `
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.animate-slide-in-right {
  animation: slideInRight 0.3s ease-out;
}
`;