import { describe, expect, it } from "vitest"
import formatFileSize from "./formatFileSize"

describe("formatFileSize", () => {
  it("formats byte sizes with the nearest unit", () => {
    expect(formatFileSize(0)).toBe("0 Bytes")
    expect(formatFileSize(1024)).toBe("1 KB")
    expect(formatFileSize(1024 * 1024 * 1.5)).toBe("1.5 MB")
  })
})
