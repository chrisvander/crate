import { describe, expect, it } from "vitest"
import { signInOutcome } from "./manual-login"

const origin = "http://127.0.0.1:5173"

describe("manual PDS sign-in observation", () => {
  it("accepts only the application's file page", () => {
    expect(signInOutcome(`${origin}/files`, origin)).toEqual({ status: "ready" })
    for (const address of ["about:blank", `${origin}/login`, "https://pds.example/files"]) {
      expect(signInOutcome(address, origin)).toEqual({ status: "pending" })
    }
  })

  it("does not treat a success callback as a restored session", () => {
    expect(
      signInOutcome("http://127.0.0.1:3030/oauth/callback?code=secret&state=secret", origin),
    ).toEqual({ status: "pending" })
  })

  it.each(["invalid_scope", "access_denied", "unrecognized-secret"])(
    "reports %s without copying provider parameters or the callback URL",
    (code) => {
      const result = signInOutcome(
        `http://127.0.0.1:3030/oauth/callback?error=${code}&state=secret&error_description=secret`,
        origin,
      )
      expect(result.status).toBe("rejected")
      expect(JSON.stringify(result)).not.toMatch(/secret|http|callback/)
    },
  )
})
