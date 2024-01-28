// lib/apollo-provider.js

'use client';

import { HttpLink, ApolloLink } from '@apollo/client';
import React from 'react';
import { NextSSRApolloClient, ApolloNextAppProvider, NextSSRInMemoryCache, SSRMultipartLink } from '@apollo/experimental-nextjs-app-support/ssr';
import { BACKEND_URL } from '@/utils/keys';

function makeClient() {
  const httpLink = new HttpLink({
    uri: BACKEND_URL,
  });

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link:
      typeof window === 'undefined'
        ? ApolloLink.from([
            new SSRMultipartLink({
              stripDefer: true,
            }),
            httpLink,
          ])
        : httpLink,
  });
}

function ApolloWrapper({ children }: React.PropsWithChildren) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}

export default ApolloWrapper;
