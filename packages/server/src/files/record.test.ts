import { describe, expect, it } from "vitest"

import { fileCollection, fullPath, isFileRecord, toFileModel, type StoredFile } from "./record"

const storedFile = (
  name: string,
  path: string,
  type: "file" | "directory",
  size = 0,
): StoredFile => ({
  cid: `cid-${name}`,
  uri: `at://did:plc:test/${fileCollection}/${name}`,
  record: {
    $type: fileCollection,
    createdAt: "2026-08-29T00:00:00.000Z",
    name,
    path,
    size,
    type,
  },
})

describe("ATProto file records", () => {
  it("validates the record boundary", () => {
    expect(isFileRecord(storedFile("note.txt", "/", "file").record)).toBe(true)
    expect(isFileRecord({ ...storedFile("note.txt", "/", "file").record, size: "1" })).toBe(false)
  })

  it("maps a directory and its direct children to the existing file model", () => {
    const directory = storedFile("docs", "/", "directory")
    const child = storedFile("note.txt", "/docs", "file", 12)
    const nested = storedFile("deep.txt", "/docs/archive", "file", 8)

    expect(fullPath(directory)).toBe("/docs")
    expect(toFileModel(directory, [directory, child, nested])).toMatchObject({
      cumulativeSize: 12,
      links: [{ cid: "cid-note.txt", name: "note.txt", size: 12 }],
    })
  })
})
