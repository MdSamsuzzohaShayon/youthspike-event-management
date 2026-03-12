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
