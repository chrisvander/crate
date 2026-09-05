import createClient from "openapi-fetch"
import type { paths } from "./schema"

export type { components, operations, paths } from "./schema"

/** Same-origin browser sessions by default; native runtimes can supply their own fetch. */
export function createCrateClient(options: { baseUrl?: string; fetch?: typeof fetch } = {}) {
  return createClient<paths>({ credentials: "include", ...options })
}
