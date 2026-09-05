import { describe, expect, it } from "vitest"
import { file } from "../test/fixtures"
import { selectedEntries, validName, visibleFiles } from "./files"

describe("file presentation", () => {
  const first = file({ id: "a", name: "File 2.txt", size: 20 })
  const second = file({
    id: "b",
    name: "File 10.txt",
    size: 10,
    kind: "directory",
    createdAt: "2026-09-03T00:00:00.000Z",
    updatedAt: "2026-09-04T00:00:00.000Z",
  })

  it("filters without modifying the source and sorts names numerically", () => {
    const files = [second, first]
    expect(visibleFiles(files, " FILE ", "Name", false)).toEqual([first, second])
    expect(files).toEqual([second, first])
    expect(visibleFiles(files, "missing", "Name", false)).toEqual([])
  })
  it.each([
    ["Size", [second, first]],
    ["Kind", [second, first]],
    ["Created", [first, second]],
    ["Modified", [first, second]],
  ] as const)("implements %s sorting", (sort, expected) => {
    expect(visibleFiles([first, second], "", sort, false)).toEqual(expected)
    expect(visibleFiles([first, second], "", sort, true)).toEqual([...expected].reverse())
  })
  it("selects stable record IDs, not names or revisions", () => {
    const renamed = file({ id: "a", name: "Renamed", revision: "revision-two" })
    expect(selectedEntries([renamed, file({ id: "b", name: "Renamed" })], ["a"])).toEqual([renamed])
  })
})

describe("file names", () => {
  it.each(["", " ", ".", "..", "a/b", "a\\b", "a\0b", "a\nb"])("rejects %j", (name) => {
    expect(validName(name)).toBe(false)
  })
  it.each(["report.txt", "Résumé 2026.pdf", ".hidden", "emoji 📦"])("allows %j", (name) => {
    expect(validName(name)).toBe(true)
  })
})
