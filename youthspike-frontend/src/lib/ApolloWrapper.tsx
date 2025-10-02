'use client';

import {
  ApolloNextAppProvider,
  ApolloClient,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';
import { setContext } from '@apollo/client/link/context';
import { BACKEND_URL } from '@/utils/keys';
import { getCookie } from '@/utils/cookie';
import { HttpLink } from '@apollo/client';

function makeClient() {
  // Authorization header
  const authLink = setContext((_, { headers }) => {
    const token = getCookie('token'); // Client-side only
    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    };
  });

  const httpLink = new HttpLink({
    uri: BACKEND_URL, // Must be absolute
    fetchOptions: {
      // Customize fetch behavior here if needed
      // cache: 'no-store', next: { revalidate: 0 }, etc.
    },
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: authLink.concat(httpLink),
    // devtools: {
    //   enabled: typeof window !== "undefined", // ✅ replaces connectToDevTools
    // },
  });
}

export function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloNextAppProvider makeClient={makeClient}>
      {children}
    </ApolloNextAppProvider>
  );
}
