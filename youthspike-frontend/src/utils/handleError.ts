/* eslint-disable import/prefer-default-export */
import React from 'react';
import { removeCookie } from './cookie';
import { EMessage, IMessage } from '@/types';

interface IResponse {
  message: string;
  success: boolean;
  code: number;
  data?: any;
}

interface IHandleResponseProps {
  response: IResponse;
  setMessage: React.Dispatch<React.SetStateAction<IMessage | null>>;
}

export function handleResponse({ response, setMessage }: IHandleResponseProps): boolean {
  const { success } = response;
  if (success) return success;

  if (response.message) setMessage({ type: EMessage.ERROR, message: response.message });
  if (response.code === 401) {
    removeCookie('user');
    removeCookie('token');
    if (window) window.location.reload();
  }

  // Check response
  console.info(response);
  return success;
}
