'use client';

import React from 'react';
import { BACKEND_URL } from '@/utils/keys';
import { ApolloClient, InMemoryCache, ApolloProvider, createHttpLink, HttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getCookie } from '@/utils/cookie';

// Explicitly using the fetch API
const fetchWithPolyfill = (uri: string, options: any) => {
  // Ensure fetch works in all environments
  return typeof window !== 'undefined' ? fetch(uri, options) : null;
};

// Http link using the fetch API
const httpLink = createHttpLink({
  uri: BACKEND_URL,
  // fetch: fetchWithPolyfill,  // Explicitly set fetch
});

const authLink = setContext((_, { headers }) => {
  const token = getCookie('token');
  
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

// Create the Apollo client with the links
export const client = new ApolloClient({
  link: authLink.concat(httpLink),  // Chain auth and http links
  cache: new InMemoryCache(),
});

function ApolloWrapper({ children }: React.PropsWithChildren) {
  return (
    <ApolloProvider client={client}>
      {children}
    </ApolloProvider>
  );
}

export default ApolloWrapper;