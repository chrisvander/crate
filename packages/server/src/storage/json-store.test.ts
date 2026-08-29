import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach, describe, expect, it } from "vitest"

import { JsonStore } from "./json-store"

const directories: string[] = []

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  )
})

describe("JsonStore", () => {
  it("serializes concurrent writes and persists their values", async () => {
    const directory = await mkdtemp(join(tmpdir(), "crate-store-"))
    const path = join(directory, "store.json")
    directories.push(directory)

    const store = new JsonStore<number>(path)
    await Promise.all([store.set("one", 1), store.set("two", 2)])

    expect(await store.get("one")).toBe(1)
    expect(JSON.parse(await readFile(path, "utf8"))).toEqual({ one: 1, two: 2 })
  })
})
