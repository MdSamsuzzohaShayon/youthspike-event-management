/* eslint-disable import/prefer-default-export */
import React from 'react';
import { IError } from '@/types';
import { removeCookie } from './cookie';

interface IResponse {
  message: string;
  success: boolean;
  code: number;
  data?: any;
}

interface IHandleResponseProps {
  response: IResponse;
  setActErr: React.Dispatch<React.SetStateAction<IError | null>>;
}

export function handleResponse({ response, setActErr }: IHandleResponseProps): boolean {
  const { success } = response;
  if (success) return success;

  if (response.message) setActErr({ code: response.code, message: response.message, success });
  if (response.code === 401) {
    removeCookie('user');
    removeCookie('token');
    if (window) window.location.reload();
  }

  // Check response
  console.log(response);
  return success;
}
