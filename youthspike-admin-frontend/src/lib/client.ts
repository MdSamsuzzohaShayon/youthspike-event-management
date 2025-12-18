// lib/client.ts
import { BACKEND_URL } from "@/utils/keys";
import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { registerApolloClient } from "@apollo/client-integration-nextjs";
import { SetContextLink } from "@apollo/client/link/context";
import { cookies } from "next/headers";

export const { getClient, query, PreloadQuery } = registerApolloClient(() => {
  // 🔐 Auth link (modern replacement for setContext)
  const authLink = new SetContextLink(async (prevContext) => {
    const cookieStore = await cookies(); // sync in App Router
    const token = cookieStore.get("token")?.value;

    return {
      headers: {
        ...prevContext.headers,
        authorization: token ? `Bearer ${token}` : "",
      },
    };
  });

  // 🌐 HTTP link
  const httpLink = new HttpLink({
    uri: BACKEND_URL,
    fetch,
  });

  return new ApolloClient({
    cache: new InMemoryCache(),
    // ✅ Modern chaining (no `from`)
    link: authLink.concat(httpLink),
  });
});
