// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/preact"
import { afterEach, expect, it, vi } from "vitest"
import { session } from "../test/fixtures"
import { PublicNavigation } from "./PublicNavigation"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
it("restores account-aware public navigation and aborts on unmount", async () => {
  let signal: AbortSignal | undefined
  vi.stubGlobal(
    "fetch",
    vi.fn(async (request: Request) => {
      signal = request.signal
      return Response.json(session)
    }),
  )
  const { unmount } = render(<PublicNavigation />)
  expect(await screen.findByRole("link", { name: "Settings" })).toBeTruthy()
  expect(screen.queryByRole("link", { name: "Log in" })).toBeNull()
  unmount()
  expect(signal?.aborted).toBe(true)
})
it("keeps the public login link available when no session can be restored", async () => {
  const fetch = vi.fn(async () => Response.json({}, { status: 401 }))
  vi.stubGlobal("fetch", fetch)
  render(<PublicNavigation />)
  await waitFor(() => expect(fetch).toHaveBeenCalledOnce())
  expect(screen.getByRole("link", { name: "Log in" })).toBeTruthy()
})
