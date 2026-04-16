import { IMessage } from '@/types';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { removeCookie } from './clientCookie';

interface IHandleApolloErrorProps {
  error: unknown;
  showMessage?: (message: Omit<IMessage, "id">) => void;
}

interface IHandleResponseProps {
  response: any;
  showMessage?: (message: Omit<IMessage, "id">) => void;
}

export function handleResponse({ response, showMessage }: IHandleResponseProps): Promise<boolean> {
  return new Promise((resolve) => {
    const successCode = response?.code >= 200 && response?.code < 300;
    if (!successCode) {
      if (showMessage) {
        showMessage({
          type: 'error',
          message: response?.message || 'An error occurred',
          code: response?.code || 500,
        });
      }
      resolve(false);
      return;
    }
    if (showMessage && response?.message) {
      showMessage({
        type: 'success',
        message: response.message,
        code: response?.code,
      });
    }
    resolve(true);
  });
}

export function handleError({ error, showMessage }: IHandleApolloErrorProps): void {
  try {
    // Check if error is a CombinedGraphQLErrors instance
    if (CombinedGraphQLErrors.is(error)) {
      error.errors.forEach((graphQLError) => {
        const code = graphQLError.extensions?.code || 500;
        const message = graphQLError.extensions?.message || graphQLError.message || 'GraphQL Error';

        // Handle unauthenticated
        if (code === 'UNAUTHENTICATED' || code === 401) {
          removeCookie('user');
          removeCookie('token');
          if (typeof window !== 'undefined') window.location.reload();
        }

        if (showMessage) {
          showMessage({
            code: typeof code === 'number' ? code : 500,
            message: typeof message === 'string' ? message : JSON.stringify(message),
            type:"error"
          });
        }

        console.error('GraphQL Error:', graphQLError);
      });

      // Optional: access original GraphQL result
      // console.log(error.result);

      return;
    }

    // Handle generic errors
    console.error('Unexpected Error:', error);
    if (showMessage) {
      showMessage({
        code: 500,
        message: typeof error === 'string' ? error : JSON.stringify(error),
        type:"error"
      });
    }
  } catch (err) {
    console.error('Error in handleError function:', err);
    if (showMessage) {
      showMessage({
        code: 500,
        message: 'Error handling failed',
        type:"error"
      });
    }
  }
}


type IUnifiedResult = {
  success: boolean;
  code: number;
  message: string;
};

type IHandleInput = {
  response?: any;
  error?: any;
};

export function handleApiResult({ response, error }: IHandleInput): IUnifiedResult {
  try {
    // -----------------------------
    // 1. Handle GraphQL Errors
    // -----------------------------
    if (error && CombinedGraphQLErrors.is(error)) {
      const firstError = error.errors?.[0];

      const code = firstError?.extensions?.code || 500;
      const message =
        firstError?.extensions?.message ||
        firstError?.message ||
        'GraphQL Error';

      // Business logic: UNAUTHENTICATED
      if (code === 'UNAUTHENTICATED' || code === 401) {
        removeCookie('user');
        removeCookie('token');
        if (typeof window !== 'undefined') window.location.reload();
      }

      console.error('GraphQL Error:', firstError);

      return {
        success: false,
        code: typeof code === 'number' ? code : 500,
        message: typeof message === 'string' ? message : JSON.stringify(message),
      };
    }

    // -----------------------------
    // 2. Handle API Response
    // -----------------------------
    if (response) {
      const code = response?.code ?? 500;
      const message = response?.message || 'An error occurred';
      const success = code >= 200 && code < 300;

      return {
        success,
        code,
        message,
      };
    }

    // -----------------------------
    // 3. Handle Unknown Errors
    // -----------------------------
    if (error) {
      console.error('Unexpected Error:', error);

      return {
        success: false,
        code: 500,
        message: typeof error === 'string' ? error : JSON.stringify(error),
      };
    }

    // -----------------------------
    // 4. Fallback (should not happen)
    // -----------------------------
    return {
      success: false,
      code: 500,
      message: 'Unknown error occurred',
    };
  } catch (err) {
    console.error('Error in handleApiResult:', err);

    return {
      success: false,
      code: 500,
      message: 'Error handling failed',
    };
  }
}