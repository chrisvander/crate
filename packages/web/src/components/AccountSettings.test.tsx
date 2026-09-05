// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/preact"
import { afterEach, expect, it, vi } from "vitest"
import { session } from "../test/fixtures"
import { AccountSettings } from "./AccountSettings"

afterEach(cleanup)
it("shows PDS-owned identity without local profile editors or placeholder settings", () => {
  const onLogout = vi.fn()
  render(<AccountSettings session={session} pending={false} onLogout={onLogout} />)
  expect(screen.getByLabelText("Handle").getAttribute("readonly")).not.toBeNull()
  expect(screen.getByDisplayValue(session.user.did)).toBe(screen.getByLabelText("Account DID"))
  expect(screen.queryByText("Security")).toBeNull()
  expect(screen.queryByText("Plan & Billing")).toBeNull()
  fireEvent.click(screen.getByRole("button", { name: "Log out" }))
  expect(onLogout).toHaveBeenCalledOnce()
})
