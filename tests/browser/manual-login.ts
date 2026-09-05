import { setTimeout } from "node:timers/promises"
import type { Page } from "@playwright/test"

type Outcome = { status: "pending" | "ready" | "timeout" } | { status: "rejected"; message: string }

export function signInOutcome(address: string, appOrigin: string): Outcome {
  const location = new URL(address)
  if (location.pathname === "/oauth/callback" && location.searchParams.has("error")) {
    const code = location.searchParams.get("error")
    const message =
      code === "invalid_scope"
        ? "The PDS rejected the requested permissions. Check the space declaration and OAuth scopes."
        : code === "access_denied"
          ? "The PDS sign-in was denied."
          : "The PDS rejected the sign-in request."
    return { status: "rejected", message }
  }
  return {
    status: location.origin === appOrigin && location.pathname === "/files" ? "ready" : "pending",
  }
}

export async function waitForManualSignIn(page: Page, appOrigin: string, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs
  while (!page.isClosed() && Date.now() < deadline) {
    const result = signInOutcome(page.url(), appOrigin)
    if (result.status !== "pending") return result
    // Do not leave a locator pending on the provider page: cancellation logs its full URL.
    await setTimeout(250)
  }
  return { status: "timeout" } as const
}
