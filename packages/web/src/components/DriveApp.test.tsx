// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/preact"
import { afterEach, describe, expect, it, vi } from "vitest"
import DriveApp from "./DriveApp"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})
describe("ATProto session restoration", () => {
  it("waits for the session before showing login", async () => {
    let resolve: (response: Response) => void = () => {}
    vi.stubGlobal(
      "fetch",
      vi.fn(
        () =>
          new Promise<Response>((done) => {
            resolve = done
          }),
      ),
    )
    render(<DriveApp mode="files" />)
    expect(screen.getByRole("status").textContent).toContain("Restoring")
    expect(screen.queryByRole("button", { name: "Continue with ATProto" })).toBeNull()
    resolve(Response.json({ code: "unauthorized", message: "No session." }, { status: 401 }))
    expect(await screen.findByRole("button", { name: "Continue with ATProto" })).toBeTruthy()
  })
  it("shows PDS capability failures instead of pretending the user is signed out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json(
          {
            code: "spaces_unavailable",
            message: "This PDS does not support private Spaces.",
          },
          { status: 503 },
        ),
      ),
    )
    render(<DriveApp mode="files" />)
    expect((await screen.findByRole("alert")).textContent).toContain("private Spaces")
    expect(screen.queryByRole("button", { name: "Continue with ATProto" })).toBeNull()
  })
})
