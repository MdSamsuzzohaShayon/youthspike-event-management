// lib/client/cookies.ts
'use client';

import { IUserContext } from "@/types";
import { FRONTEND_URL, NODE_ENV } from "./keys";

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const regex = new RegExp(`(?:(?:^|.*;\\s*)${name}\\s*=\\s*([^;]*).*$)|^.*$`);
  const match = value.match(regex);
  return match ? match[1] : null;
}

export function setCookie(name: string, value: string, days: number): void {
  if (typeof document === 'undefined') return;
  
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + days);

  const domainOption = NODE_ENV === "production" 
    ? `Domain=${FRONTEND_URL.split('//')[1]};` 
    : '';

  document.cookie = `${name}=${value}; expires=${expirationDate.toUTCString()}; ${domainOption} path=/; ${NODE_ENV === "production" ? 'Secure;' : ''}`;
}

export function removeCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  const expiredDate = new Date(0);
  const domainOption = NODE_ENV === "production" 
    ? `Domain=${FRONTEND_URL.split('//')[1]};` 
    : '';

  document.cookie = `${name}=; expires=${expiredDate.toUTCString()}; ${domainOption} path=/; ${NODE_ENV === "production" ? 'Secure;' : ''}`;
}

export function getUserFromCookie(): IUserContext {
  const instantToken = getCookie('token');
  const instantInfo = getCookie('user');
  return {
    info: instantInfo ? JSON.parse(instantInfo) : null,
    token: instantToken ? instantToken : null
  };
}