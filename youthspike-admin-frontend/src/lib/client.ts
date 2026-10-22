// lib/client.ts
// Server-side Apollo client (React Server Components) used by `PreloadQuery`.
// The browser client that renders the app lives in `lib/ApolloWrapper.tsx`.
import { ApolloLink, HttpLink } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';
import { cookies } from 'next/headers';

import { BACKEND_URL } from '@/utils/keys';

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  // Attaches the auth token from the request cookie to every request.
  const authLink = new SetContextLink(async (prevContext) => {
    const cookieStore = await cookies(); // async in Next.js 15+, resolve per request
    const token = cookieStore.get('token')?.value;

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
      // Never send `Bearer undefined` - the backend extracts the token with
      // `ExtractJwt.fromAuthHeaderAsBearerToken()`, so a missing token has to
      // be omitted instead.
      delete headers.authorization;
    }

    return { headers };
  });

  const httpLink = new HttpLink({
    uri: BACKEND_URL,
    // Plain (not Next.js patched) fetch - works in Node + browser.
    fetch,
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([authLink, httpLink]),
  });
});
