import { spawnSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import { expect, it } from "vitest"

it("generates typed binary requests and detects contract drift", async () => {
  const directory = await mkdtemp(join(tmpdir(), "crate-typegen-test-"))
  try {
    const schema = join(directory, "openapi.json")
    const output = join(directory, "schema.ts")
    await writeFile(
      schema,
      JSON.stringify({
        openapi: "3.0.3",
        info: { title: "Fixture", version: "1" },
        paths: {
          "/upload": {
            post: {
              operationId: "upload",
              requestBody: {
                required: true,
                content: {
                  "application/octet-stream": { schema: { type: "string", format: "binary" } },
                },
              },
              responses: { "204": { description: "Stored" } },
            },
          },
        },
      }),
    )
    const generator = fileURLToPath(new URL("./generate.ts", import.meta.url))
    const generate = (...args: string[]) =>
      spawnSync("bun", [generator, schema, output, ...args], { encoding: "utf8" })
    expect(generate().status).toBe(0)
    expect(await readFile(output, "utf8")).toContain('"application/octet-stream": Blob')
    expect(generate("--check").status).toBe(0)
    await writeFile(output, "stale output")
    const stale = generate("--check")
    expect(stale.status).not.toBe(0)
    expect(stale.stderr).toContain("client contract is stale")
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
