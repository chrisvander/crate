// @vitest-environment jsdom
import { File as NodeFile } from "node:buffer"
import { afterEach, describe, expect, it, vi } from "vitest"
import { actions } from "./actions"
import { file } from "../test/fixtures"

afterEach(() => vi.unstubAllGlobals())

describe("raw PDS file transport", () => {
  it.each(["upload", "replace"] as const)(
    "sends %s bytes with their MIME type and revision context",
    async (operation) => {
      const requests: Request[] = []
      vi.stubGlobal(
        "fetch",
        vi.fn(async (input: RequestInfo | URL) => {
          requests.push(input instanceof Request ? input : new Request(input))
          return Response.json(file())
        }),
      )
      vi.stubGlobal("File", NodeFile)
      const content = new File(["Hello PDS"], "notes.txt", { type: "text/plain" })
      const entry = file({ parentId: "folder-one" })
      const command =
        operation === "upload"
          ? actions.upload([content], entry.parentId)
          : actions.replace(entry, content)
      await command(new AbortController().signal)
      expect(requests).toHaveLength(1)
      const request = requests[0]!
      expect(request.headers.get("Content-Type")).toBe("application/octet-stream")
      expect(await request.text()).toBe("Hello PDS")
      const url = new URL(request.url)
      expect(url.searchParams.get("mimeType")).toBe(content.type)
      if (operation === "upload") {
        expect(request.method).toBe("POST")
        expect(url.searchParams.get("parentId")).toBe("folder-one")
        expect(url.searchParams.get("name")).toBe("notes.txt")
      } else {
        expect(request.method).toBe("PUT")
        expect(url.searchParams.get("revision")).toBe(entry.revision)
      }
    },
  )
})
