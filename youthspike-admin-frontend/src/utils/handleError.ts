import { IError } from '@/types';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { removeCookie } from './clientCookie';

interface IHandleApolloErrorProps {
  error: unknown;
  setActErr?: React.Dispatch<React.SetStateAction<IError | null>>;
}

export function handleError({ error, setActErr }: IHandleApolloErrorProps): void {
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

        if (setActErr) {
          setActErr({
            code: typeof code === 'number' ? code : 500,
            message: typeof message === 'string' ? message : JSON.stringify(message),
            success: false,
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
    if (setActErr) {
      setActErr({
        code: 500,
        message: typeof error === 'string' ? error : JSON.stringify(error),
        success: false,
      });
    }
  } catch (err) {
    console.error('Error in handleError function:', err);
    if (setActErr) {
      setActErr({
        code: 500,
        message: 'Error handling failed',
        success: false,
      });
    }
  }
}
