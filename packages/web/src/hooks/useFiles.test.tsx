// @vitest-environment jsdom
import { QueryClientProvider } from "@tanstack/preact-query"
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/preact"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { actions } from "../lib/actions"
import { filesKey, sessionKey, type Session } from "../lib/api"
import { createQueryClient } from "../lib/query"
import { file, session } from "../test/fixtures"
import { useFiles } from "./useFiles"

const fetchMock = vi.fn<typeof fetch>()
beforeEach(() => vi.stubGlobal("fetch", fetchMock))
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  fetchMock.mockReset()
})

function Harness({ account = session }: { account?: Session }) {
  const { query, execute, refresh } = useFiles(account, undefined, false)
  return (
    <>
      <span>{query.data?.files.map((entry) => entry.name).join(",") ?? "Loading"}</span>
      <button onClick={() => void refresh()}>Refresh</button>
      <button
        onClick={() => {
          const entry = query.data?.files[0]
          if (entry) void execute(actions.rename(entry, "Renamed.txt"))
        }}
      >
        Rename
      </button>
    </>
  )
}
const createClient = createQueryClient

describe("account-scoped file cache", () => {
  it("refetches changed root contents even when stable IDs are unchanged", async () => {
    let entry = file()
    fetchMock.mockImplementation(async () => Response.json({ files: [entry] }))
    const client = createClient()
    render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    )
    await screen.findByText("Notes.txt")
    entry = { ...entry, name: "Updated.txt", revision: "new-revision" }
    fireEvent.click(screen.getByText("Refresh"))
    await screen.findByText("Updated.txt")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })
  it("sends a revision-checked rename and invalidates the actual listing", async () => {
    let entry = file()
    const writes: unknown[] = []
    fetchMock.mockImplementation(async (input) => {
      const request = input instanceof Request ? input : new Request(input)
      if (request.method === "PUT") {
        const body = await request.json()
        writes.push(body)
        entry = { ...entry, name: body.name, revision: "next-revision" }
        return Response.json(entry)
      }
      return Response.json({ files: [entry] })
    })
    render(
      <QueryClientProvider client={createClient()}>
        <Harness />
      </QueryClientProvider>,
    )
    await screen.findByText("Notes.txt")
    fireEvent.click(screen.getByText("Rename"))
    await screen.findByText("Renamed.txt")
    expect(writes).toEqual([{ revision: "revision-one", name: "Renamed.txt" }])
  })
  it("separates account and space keys and clears cached files on unmount", async () => {
    expect(filesKey("did:a", "space:a")).not.toEqual(filesKey("did:b", "space:a"))
    expect(filesKey("did:a", "space:a")).not.toEqual(filesKey("did:a", "space:b"))
    fetchMock.mockResolvedValue(Response.json({ files: [file()] }))
    const client = createClient()
    const { unmount } = render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    )
    await screen.findByText("Notes.txt")
    unmount()
    expect(
      client.getQueriesData({ queryKey: filesKey(session.user.did, session.space.uri) }),
    ).toEqual([])
  })
  it("clears the authenticated session after an expired-session response", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ code: "unauthorized", message: "Please log in." }, { status: 401 }),
    )
    const client = createClient()
    client.setQueryData(sessionKey, session)
    render(
      <QueryClientProvider client={client}>
        <Harness />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(client.getQueryData(sessionKey)).toBeNull())
  })
  it("aborts an in-flight request on unmount", async () => {
    let signal: AbortSignal | undefined
    fetchMock.mockImplementation(async (input) => {
      if (input instanceof Request) signal = input.signal
      return new Promise<Response>(() => {})
    })
    const { unmount } = render(
      <QueryClientProvider client={createClient()}>
        <Harness />
      </QueryClientProvider>,
    )
    await waitFor(() => expect(signal).toBeDefined())
    unmount()
    expect(signal?.aborted).toBe(true)
  })
})
