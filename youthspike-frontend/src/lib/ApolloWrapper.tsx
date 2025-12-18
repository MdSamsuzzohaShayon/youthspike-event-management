'use client';

import React from 'react';
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from '@apollo/client';
import { BACKEND_URL } from '@/utils/keys';
import { ApolloProvider } from '@apollo/client/react';
import { getCookie } from '@/utils/clientCookie';

/**
 * Auth middleware link
 */
const authLink = new ApolloLink((operation, forward) => {
  const token = getCookie('token');

  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  }));

  return forward(operation);
});

/**
 * HTTP link
 */
const httpLink = new HttpLink({
  uri: BACKEND_URL,
  credentials: 'include',
});

/**
 * Apollo Client
 */
export const client = new ApolloClient({
  link: ApolloLink.from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

function ApolloWrapper({ children }: React.PropsWithChildren) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default ApolloWrapper;