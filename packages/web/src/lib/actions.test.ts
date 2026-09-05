// @vitest-environment jsdom
import { File as NodeFile } from "node:buffer"
import { afterEach, describe, expect, it, vi } from "vitest"
import { actions } from "./actions"
import { file } from "../test/fixtures"

afterEach(() => vi.unstubAllGlobals())

describe("bulk restore transport", () => {
  const parent = file({
    id: "parent",
    name: "Z folder",
    kind: "directory",
    trashedAt: "2026-09-05",
  })
  const child = file({ id: "child", name: "A child", parentId: parent.id, trashedAt: "2026-09-05" })
  it("sends parent restore before child restore even when selection is child-first", async () => {
    const paths: string[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = input instanceof Request ? input : new Request(input)
        paths.push(new URL(request.url).pathname)
        return Response.json(file())
      }),
    )
    await actions.restoreMany([child, parent])(new AbortController().signal)
    expect(paths).toEqual(["/api/v1/files/parent/restore", "/api/v1/files/child/restore"])
  })
  it("preflights all ancestry before writing any selected file", async () => {
    const methods: string[] = []
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const request = input instanceof Request ? input : new Request(input)
        methods.push(request.method)
        return Response.json({ message: "Missing folder" }, { status: 404 })
      }),
    )
    await expect(
      actions.restoreMany([file({ id: "unrelated" }), child])(new AbortController().signal),
    ).rejects.toThrow("ancestor folder is missing")
    expect(methods).toEqual(["GET"])
  })
})

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
