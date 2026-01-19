'use client';

import { useEffect } from 'react';
import { handleAuthError } from './handleAuthError';

/**
 * React hook to guard components against expired auth
 */
export const useAuthGuard = (code?: number) => {
  useEffect(() => {
    handleAuthError(code);
  }, [code]);
};
