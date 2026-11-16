// ```ts
import { ApolloClient, HttpLink, InMemoryCache, from } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import { getToken } from "./auth";

const httpLink = new HttpLink({
  uri: "http://localhost:4000/graphql",
});
// http://localhost:4000/graphql
const authLink = setContext(async (_, { headers }) => {
  const token = await getToken();

  return {
    headers: {
      ...headers,

      // Only send Authorization when a token actually exists.
      ...(token
        ? {
            authorization: `Bearer ${token}`,
          }
        : {}),
    },
  };
});

const apolloClient = new ApolloClient({
  link: from([authLink, httpLink]),
  cache: new InMemoryCache(),
});

export { apolloClient };
// ```
