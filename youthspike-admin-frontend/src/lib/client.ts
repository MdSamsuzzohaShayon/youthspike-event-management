// lib/client.ts
import { BACKEND_URL } from "@/utils/keys";
import { HttpLink, from } from "@apollo/client";
import {
  registerApolloClient,
  ApolloClient,
  InMemoryCache,
} from "@apollo/client-integration-nextjs";
import { setContext } from "@apollo/client/link/context";
import { cookies } from "next/headers";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  // Middleware to attach token to each request
  const authLink = setContext(async (_, { headers }) => {
    const cookieStore = await cookies(); // ✅ synchronous in Next.js server env
    const token = cookieStore.get("token")?.value;

    return {
      headers: {
        ...headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });

  // HTTP connection to backend GraphQL
  const httpLink = new HttpLink({
    uri: BACKEND_URL,
    fetch, // ✅ use native fetch (works in Node + browser)
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: from([authLink, httpLink]), // chain auth + http links
  });
});
