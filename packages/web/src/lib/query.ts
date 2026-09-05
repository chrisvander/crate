import { MutationCache, QueryCache, QueryClient } from "@tanstack/preact-query"
import { isUnauthorized, sessionKey } from "./api"

export function createQueryClient() {
  const onError = (error: Error) => {
    if (!isUnauthorized(error)) return
    client.setQueryData(sessionKey, null)
    void client.cancelQueries({ queryKey: ["files"] })
    client.removeQueries({ queryKey: ["files"] })
  }
  const client = new QueryClient({
    queryCache: new QueryCache({ onError }),
    mutationCache: new MutationCache({ onError }),
    defaultOptions: { queries: { staleTime: 15_000, retry: false } },
  })
  return client
}
