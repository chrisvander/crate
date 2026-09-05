import { createCrateClient, type components } from "@crate/client"

export type FileEntry = components["schemas"]["FileEntry"]
export type FileVersion = components["schemas"]["FileVersion"]
export type Session = components["schemas"]["Session"]

export const api = createCrateClient({
  baseUrl: typeof window === "undefined" ? undefined : window.location.origin,
  fetch: (request, init) => fetch(request, init),
})

export function unwrap<T>(result: { data?: T; error?: unknown; response: Response }): T {
  if (!result.response.ok || result.data === undefined) {
    const detail = result.error
    const message =
      typeof detail === "object" &&
      detail !== null &&
      "message" in detail &&
      typeof detail.message === "string"
        ? detail.message
        : result.response.statusText
    throw Object.assign(new Error(message || "The request failed."), {
      status: result.response.status,
    })
  }
  return result.data
}

export function isUnauthorized(error: unknown) {
  return error instanceof Error && "status" in error && error.status === 401
}

export const sessionKey = ["session"] as const
export const filesKey = (did: string, spaceUri: string) => ["files", did, spaceUri] as const
export const contentUrl = (id: string) => `/api/v1/files/${encodeURIComponent(id)}/content`

export async function getSession(signal?: AbortSignal) {
  const result = await api.GET("/api/v1/session", { signal })
  return result.response.status === 401 ? null : unwrap(result)
}

export async function login(handle: string) {
  return unwrap(await api.POST("/oauth/login", { body: { handle } }))
}
