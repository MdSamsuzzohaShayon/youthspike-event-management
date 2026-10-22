'use client';

import React from 'react';
import {
  ApolloClient,
  InMemoryCache,
  HttpLink,
  ApolloLink,
} from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { BACKEND_URL } from '@/utils/keys';
import { ApolloProvider } from '@apollo/client/react';
import { getCookie } from '@/utils/clientCookie';

/**
 * Auth middleware link
 */
const authLink = new SetContextLink((prevContext) => {
  const token = getCookie('token');

  // `prevContext.headers` is a plain object, but it can also be a `Headers`
  // instance - spreading a `Headers` instance would drop every header.
  const headers: Record<string, string> = {};
  const prevHeaders = prevContext.headers;
  if (prevHeaders instanceof Headers) {
    prevHeaders.forEach((value, key) => {
      headers[key] = value;
    });
  } else if (prevHeaders) {
    Object.assign(headers, prevHeaders);
  }

  if (token) {
    headers.authorization = `Bearer ${token}`;
  } else {
    // Never send an empty `Authorization` header. The backend reads the token
    // with `ExtractJwt.fromAuthHeaderAsBearerToken()`, an empty value does not
    // match "Bearer <token>" and passport fails with "No auth token".
    delete headers.authorization;
  }

  return { headers };
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