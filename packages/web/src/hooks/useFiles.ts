import { useMutation, useQuery, useQueryClient } from "@tanstack/preact-query"
import { useEffect, useMemo, useState } from "preact/hooks"
import { api, filesKey, unwrap, type Session } from "../lib/api"
import type { Command } from "../lib/actions"

export function useFiles(session: Session, parentId: string | undefined, trash: boolean) {
  const client = useQueryClient()
  const did = session.user.did
  const spaceUri = session.space.uri
  const prefix = useMemo(() => filesKey(did, spaceUri), [did, spaceUri])
  const [controller] = useState(() => new AbortController())
  const query = useQuery({
    queryKey: [...prefix, "directory", parentId ?? null, trash],
    queryFn: async ({ signal }) =>
      unwrap(
        await api.GET("/api/v1/files", {
          params: { query: { parentId, trash } },
          signal,
        }),
      ),
  })
  const mutation = useMutation({
    mutationFn: (command: Command) => command(controller.signal),
    onSettled: () => client.invalidateQueries({ queryKey: prefix }),
  })
  useEffect(
    () => () => {
      controller.abort()
      void client.cancelQueries({ queryKey: prefix })
      client.removeQueries({ queryKey: prefix })
    },
    [client, controller, prefix],
  )
  return {
    query,
    pending: mutation.isPending,
    error: mutation.error,
    dismissError: mutation.reset,
    execute: async (command: Command) => {
      try {
        await mutation.mutateAsync(command)
        return true
      } catch {
        return false
      }
    },
    refresh: () => client.invalidateQueries({ queryKey: prefix }),
  }
}
