'use client';

import React from 'react';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';

import { BACKEND_URL } from '@/utils/keys';
import { getCookie } from '@/utils/clientCookie';
import { ApolloClient, CombinedGraphQLErrors, CombinedProtocolErrors, HttpLink, InMemoryCache } from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';

/* ----------------------------------
   HTTP link
----------------------------------- */
const httpLink = new HttpLink({
  uri: BACKEND_URL,
  credentials: 'include', // optional (cookies, sessions)
});

/* ----------------------------------
   Auth context link (NEW WAY)
----------------------------------- */
const authLink = new SetContextLink((prevContext) => {
  const token = getCookie('token');

  return {
    headers: {
      ...prevContext.headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

/* ----------------------------------
   Error handling (optional but recommended)
----------------------------------- */
const errorLink = new ErrorLink(({ error, operation }) => {
  if (CombinedGraphQLErrors.is(error)) {
    error.errors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error] (${operation.operationName})`,
        { message, locations, path }
      );
    });
  } 
  else if (CombinedProtocolErrors.is(error)) {
    error.errors.forEach(({ message, extensions }) => {
      console.error(
        `[Protocol error] (${operation.operationName})`,
        { message, extensions }
      );
    });
  } 
  else {
    console.error(
      `[Network error] (${operation.operationName})`,
      error
    );
  }
});

/* ----------------------------------
   Apollo Client
----------------------------------- */
export const client = new ApolloClient({
  link: authLink.concat(errorLink).concat(httpLink),
  cache: new InMemoryCache()
});

/* ----------------------------------
   Provider
----------------------------------- */
function ApolloWrapper({ children }: React.PropsWithChildren) {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
}

export default ApolloWrapper;
