import { IError } from '@/types';
// import { OperationVariables, QueryResult } from "@apollo/client";
import { ApolloError } from '@apollo/client';
// lib/handle-response.ts
import { removeCookie } from './clientCookie';

interface IResponse {
  message: string;
  success: boolean;
  code: number;
  data?: any;
}

interface IHandleResponseProps {
  response: IResponse;
  setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
}

interface IHandleApolloErrorProps {
  error: ApolloError | Error[];
  setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
}

export async function handleResponse({ response, setActErr }: IHandleResponseProps): Promise<boolean> {
  if (!response) {
    await fetch('/api/logout', { method: 'GET' });
    window.location.href = '/login';
    return false;
  };

  if (response.success) return true;

  const message = response.message || 'Internal Server Error';
  if (setActErr) setActErr({ code: response.code, message, success: response.success });

  if (response.code === 401) {
    if (typeof window !== 'undefined') {
      // Client-side handling
      await fetch('/api/logout', { method: 'GET' });
      window.location.href = '/login';
    } else {
      // Server-side handling
      // redirect('/api/logout');
    }
  }

  return false;
}

export function handleError({ error, setActErr }: IHandleApolloErrorProps): void {
  if (error instanceof ApolloError) {
    const unauthenticatedError = error.graphQLErrors.find((err) => err.extensions?.code === 'UNAUTHENTICATED');

    if (unauthenticatedError) {
      removeCookie('user');
      removeCookie('token');
      // Handle unauthenticated error
      if (setActErr) {
        setActErr({
          code: 401, // unauthenticatedError.extensions?.response?.statusCode ||
          // @ts-ignore
          message: unauthenticatedError.extensions?.response?.message || unauthenticatedError.message,
          success: false,
        });
      }

      if (window) window.location.reload();
    } else {
      // Handle other types of GraphQL errors

      if (setActErr) {
        setActErr({
          code: 500,
          // @ts-ignore
          message: error.graphQLErrors[0]?.extensions?.response?.message || error.message,
          success: false,
        });
      }
      console.log('GraphQL Error: ', error);
    }
  } else {
    // Handle non-Apollo errors
    console.log('Non-Apollo Error: ', error);
    if (setActErr) {
      setActErr({
        code: 500,
        message: `An unexpected error occurred: ${JSON.stringify(error)}`,
        success: false,
      });
    }
  }
}
