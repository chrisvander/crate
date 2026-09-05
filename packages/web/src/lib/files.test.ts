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
  it.each([
    ["Created", "createdAt"],
    ["Modified", "updatedAt"],
  ] as const)("sorts %s chronologically across time-zone offsets", (sort, field) => {
    const earliest = file({ id: "a", [field]: "2026-09-05T12:30:00+02:00" })
    const middle = file({ id: "b", [field]: "2026-09-05T11:00:00Z" })
    const latest = file({ id: "c", [field]: "2026-09-05T07:30:00-04:00" })
    const files = [middle, latest, earliest]
    expect(visibleFiles(files, "", sort, false)).toEqual([earliest, middle, latest])
    expect(visibleFiles(files, "", sort, true)).toEqual([latest, middle, earliest])
    expect(files).toEqual([middle, latest, earliest])
  })
  it.each([
    ["Created", "createdAt"],
    ["Modified", "updatedAt"],
  ] as const)("breaks equivalent %s instants by numeric name then ID", (sort, field) => {
    const first = file({ id: "a", name: "File 2.txt", [field]: "2026-09-05T12:00:00+02:00" })
    const second = file({ id: "b", name: "File 2.txt", [field]: "2026-09-05T10:00:00Z" })
    const third = file({ id: "c", name: "File 10.txt", [field]: "2026-09-05T06:00:00-04:00" })
    const files = [third, second, first]
    expect(visibleFiles(files, "", sort, false)).toEqual([first, second, third])
    expect(visibleFiles(files, "", sort, true)).toEqual([third, second, first])
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
