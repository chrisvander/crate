import { describe, expect, expectTypeOf, it } from "vitest"
import { createCrateClient } from "./index"
import type { components } from "./index"

describe("generated client transport", () => {
  it("requires a revision and limits renames to their generated fields", () => {
    type Rename = components["schemas"]["UpdateFile"]
    expectTypeOf<{ name: string }>().not.toExtend<Rename>()
    expectTypeOf<{ revision: string }>().not.toExtend<Rename>()
    expectTypeOf<{ revision: string; name: string }>().toExtend<Rename>()
    expectTypeOf<Rename>().not.toHaveProperty("parentId")
  })

  it("keeps browser session credentials on typed API requests", async () => {
    let request: Request | undefined
    const api = createCrateClient({
      baseUrl: "http://127.0.0.1:3030",
      fetch: async (input, init) => {
        request = new Request(input, init)
        return Response.json({ files: [] })
      },
    })
    const result = await api.GET("/api/v1/files")
    expect(request?.credentials).toBe("include")
    expect(request?.url).toBe("http://127.0.0.1:3030/api/v1/files")
    expect(result.data?.files).toEqual([])
  })

  it("sends binary data without JSON encoding or unsafe casts", async () => {
    let received: ArrayBuffer | undefined
    let contentType: string | null = null
    const api = createCrateClient({
      baseUrl: "http://127.0.0.1:3030",
      fetch: async (input, init) => {
        const request = new Request(input, init)
        contentType = request.headers.get("Content-Type")
        received = await request.arrayBuffer()
        return Response.json(
          { code: "UpstreamUnavailable", message: "Try again later." },
          { status: 503 },
        )
      },
    })
    const bytes = new Uint8Array([0, 255, 128, 1])
    const result = await api.POST("/api/v1/files/upload", {
      params: { query: { name: "bytes.bin" } },
      body: new Blob([bytes]),
      bodySerializer: (body) => body,
      headers: { "Content-Type": "application/octet-stream" },
    })
    expect(new Uint8Array(received ?? new ArrayBuffer(0))).toEqual(bytes)
    expect(contentType).toBe("application/octet-stream")
    expect(result.error?.code).toBe("UpstreamUnavailable")
    expect(result.response.status).toBe(503)
  })
})
