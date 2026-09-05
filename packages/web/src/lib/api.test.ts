import { describe, expect, it } from "vitest"
import { unwrap } from "./api"

describe("generated client response boundary", () => {
  it("accepts successful creation responses, not just status 200", () => {
    expect(unwrap({ data: { id: "new" }, response: new Response(null, { status: 201 }) })).toEqual({
      id: "new",
    })
  })
  it("preserves structured failure details without mutating presentation state", () => {
    expect(() =>
      unwrap({
        error: { code: "conflict", message: "The file changed on another device." },
        response: new Response(null, { status: 409 }),
      }),
    ).toThrow("The file changed on another device.")
  })
})
