// lib/apollo-client.ts
import { cookies } from 'next/headers';
import { HttpLink, ApolloLink } from '@apollo/client';
import { SSRMultipartLink, NextSSRApolloClient, NextSSRInMemoryCache } from '@apollo/experimental-nextjs-app-support/ssr';
import { BACKEND_URL } from '@/utils/keys';

export function makeClient() {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  const authLink = new ApolloLink((operation, forward) => {
    operation.setContext(({ headers = {} }) => ({
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : '',
      },
    }));
    return forward(operation);
  });

  const httpLink = new HttpLink({
    uri: BACKEND_URL,
  });

  const link =
    typeof window === 'undefined'
      ? ApolloLink.from([new SSRMultipartLink({ stripDefer: true }), authLink.concat(httpLink)])
      : authLink.concat(httpLink);

  return new NextSSRApolloClient({
    cache: new NextSSRInMemoryCache(),
    link,
  });
}