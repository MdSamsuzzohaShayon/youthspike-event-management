'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { IError } from '@/types';

interface ErrorContextType {
  actErr: IError | null;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
}

// Create the context
const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

// Custom hook for consuming the context
export const useError = (): ErrorContextType => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};

// Provider Component
interface ErrorProviderProps {
  children: ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [actErr, setActErr] = useState<IError | null>(null);

  return (
    <ErrorContext.Provider value={{ actErr, setActErr }}>
      {children}
    </ErrorContext.Provider>
  );
};
