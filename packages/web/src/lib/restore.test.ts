import { describe, expect, it, vi } from "vitest"
import { file } from "../test/fixtures"
import { restoreOrder } from "./restore"

const parent = file({ id: "parent", name: "Z folder", kind: "directory", trashedAt: "2026-09-05" })
const child = file({ id: "child", name: "A child", parentId: parent.id, trashedAt: "2026-09-05" })

describe("restore ordering", () => {
  it("restores a selected ancestor first even when the child sorts first", async () => {
    const load = vi.fn()
    expect(await restoreOrder([child, parent], load)).toEqual([parent, child])
    expect(load).not.toHaveBeenCalled()
  })
  it("follows active intermediate folders to find a selected trashed ancestor", async () => {
    const intermediate = file({ id: "middle", kind: "directory", parentId: parent.id })
    const nested = { ...child, parentId: intermediate.id }
    const load = vi.fn(async () => intermediate)
    expect(await restoreOrder([nested, parent], load)).toEqual([parent, nested])
    expect(load).toHaveBeenCalledWith(intermediate.id)
  })
  it("reports the unselected trashed ancestor before performing any restores", async () => {
    await expect(restoreOrder([child], async () => parent)).rejects.toThrow(
      'trashed folder "Z folder"',
    )
  })
  it("reports missing ancestor folders", async () => {
    await expect(restoreOrder([child], async () => undefined)).rejects.toThrow(
      "ancestor folder is missing",
    )
  })
  it("detects cycles instead of looping through malformed ancestry", async () => {
    const cyclic = { ...parent, parentId: parent.id }
    await expect(restoreOrder([cyclic], vi.fn())).rejects.toThrow("form a cycle")
  })
  it("preserves authentication errors from the generated client", async () => {
    const failure = Object.assign(new Error("Expired"), { status: 401 })
    await expect(
      restoreOrder([child], async () => {
        throw failure
      }),
    ).rejects.toBe(failure)
  })
})
