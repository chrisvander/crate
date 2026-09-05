import { describe, expect, it } from "vitest"
import { filesKey, sessionKey } from "./api"
import { createQueryClient } from "./query"
import { file, session } from "../test/fixtures"

describe("session boundary", () => {
  it("clears all account data when any private query loses its session", async () => {
    const client = createQueryClient()
    const prefix = filesKey(session.user.did, session.space.uri)
    client.setQueryData(sessionKey, session)
    client.setQueryData([...prefix, "directory"], { files: [file()] })
    await expect(
      client.fetchQuery({
        queryKey: [...prefix, "versions", "file-one"],
        queryFn: () => Promise.reject(Object.assign(new Error("Expired"), { status: 401 })),
      }),
    ).rejects.toThrow("Expired")
    expect(client.getQueryData(sessionKey)).toBeNull()
    expect(client.getQueriesData({ queryKey: prefix })).toEqual([])
  })
  it("keeps the account when the PDS reports a capability failure", async () => {
    const client = createQueryClient()
    client.setQueryData(sessionKey, session)
    await expect(
      client.fetchQuery({
        queryKey: ["files", session.user.did, session.space.uri],
        queryFn: () => Promise.reject(Object.assign(new Error("Unavailable"), { status: 503 })),
      }),
    ).rejects.toThrow("Unavailable")
    expect(client.getQueryData(sessionKey)).toEqual(session)
  })
})
