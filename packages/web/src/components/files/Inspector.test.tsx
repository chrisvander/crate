// @vitest-environment jsdom
import { QueryClientProvider } from "@tanstack/preact-query"
import { cleanup, fireEvent, render, screen } from "@testing-library/preact"
import { afterEach, expect, it, vi } from "vitest"
import { createQueryClient } from "../../lib/query"
import { file, session } from "../../test/fixtures"
import { Inspector } from "./Inspector"

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

it("shows the snapshot filename and explains full-version restoration", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      Response.json({
        versions: [
          {
            id: "snapshot",
            fileId: "file-one",
            capturedAt: "2026-09-03T00:00:00.000Z",
            file: file({ name: "Previous.txt" }),
          },
        ],
      }),
    ),
  )
  const confirm = vi.spyOn(window, "confirm").mockReturnValue(false)
  const execute = vi.fn(async () => true)
  render(
    <QueryClientProvider client={createQueryClient()}>
      <Inspector
        file={file({ name: "Current.txt" })}
        session={session}
        pending={false}
        execute={execute}
      />
    </QueryClientProvider>,
  )
  fireEvent.click(screen.getByRole("button", { name: "Version history" }))
  await screen.findByText("Previous.txt")
  fireEvent.click(screen.getByRole("button", { name: "Restore version" }))
  expect(confirm).toHaveBeenCalledWith(
    'Restore "Previous.txt", including its name and contents? The current version will remain in history.',
  )
  expect(execute).not.toHaveBeenCalled()
})
