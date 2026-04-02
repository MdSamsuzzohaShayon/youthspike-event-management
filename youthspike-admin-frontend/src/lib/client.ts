// lib/client.ts
import { IGetPlayersResponse } from '@/types';
import { BACKEND_URL } from '@/utils/keys';
import { ApolloLink, HttpLink, from } from '@apollo/client';
import { registerApolloClient, ApolloClient, InMemoryCache } from '@apollo/client-integration-nextjs';
import { SetContextLink } from '@apollo/client/link/context';
import { cookies } from 'next/headers';

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  // Middleware to attach token to each request
  const authLink = new SetContextLink(async (prevContext, operation) => {
    const cookieStore = await cookies(); // ✅ synchronous in Next.js server env
    const token = cookieStore.get('token')?.value;
    return {
      headers: {
        ...prevContext.headers,
        authorization: `Bearer ${token}`,
      },
    };
  });

  // HTTP connection to backend GraphQL
  const httpLink = new HttpLink({
    uri: BACKEND_URL,
    fetch, // ✅ use native fetch (works in Node + browser)
  });

  return new ApolloClient({
    cache: new InMemoryCache(
    //   {
    //   typePolicies: {
    //     Query: {
    //       fields: {
    //         getPlayers: {
    //           keyArgs: [], // ignore limit & offset
    //           merge(existing: Pick<IGetPlayersResponse, 'data'> | undefined = { data: [] }, incoming: IGetPlayersResponse) {
    //             return {
    //               ...incoming,
    //               data: [...(existing.data || []), ...(incoming.data || [])],
    //             };
    //           },
    //         },
    //       },
    //     },
    //   },
    // }
  ),
    // link: from([authLink, httpLink]), // chain auth + http links
    link: ApolloLink.from([authLink, httpLink]),
  });
});
