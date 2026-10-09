// FILE: app/queryClient.ts
// Purpose: The app's one react-query client, in a module with no other
//   dependencies so data helpers can reach it without loading `queries.ts`
//   (which pulls in the markdown parser).
// Layer: L3 orchestration (thread-neutral).

import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2_000,
      retry: 1,
    },
  },
});
