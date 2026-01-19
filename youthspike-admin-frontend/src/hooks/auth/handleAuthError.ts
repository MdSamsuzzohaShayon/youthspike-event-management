'use client';

import { useRouter } from 'next/navigation';

/**
 * Handles authentication errors like expired tokens
 * Can be reused across components and API handlers
 */
export const handleAuthError = (code?: number) => {
  if (code !== 401) return;

  // Remove auth cookies
  document.cookie = 'token=; Max-Age=0; path=/';
  document.cookie = 'user=; Max-Age=0; path=/';

  // Redirect to login
  window.location.href = '/login';
};
