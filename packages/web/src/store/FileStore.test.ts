import type { FileModel } from "@crate/types"
import { beforeEach, describe, expect, it } from "vitest"

import { useFileStore } from "./FileStore"

const root: FileModel = {
  cid: "did:plc:test",
  cumulativeSize: 0,
  date: "2026-08-29T00:00:00.000Z",
  links: [],
  name: "Files",
  size: 0,
  type: "directory",
}

beforeEach(() => useFileStore.setState({ files: { "/": root }, revision: 0 }))

describe("FileStore", () => {
  it("invalidates a directory after a write", () => {
    useFileStore.getState().refresh("/")

    expect(useFileStore.getState().files["/"]).toBeUndefined()
    expect(useFileStore.getState().revision).toBe(1)
  })
})
