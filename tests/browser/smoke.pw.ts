import { expect, test } from "@playwright/test"

test("Astro pages hydrate and protect the file browser", async ({ page }) => {
  const errors: string[] = []
  page.on("pageerror", (error) => errors.push(error.message))
  await page.goto("/")
  await expect(page.getByRole("heading", { name: "Cloud storage, reimagined." })).toBeVisible()
  await page.getByRole("link", { name: "Open files", exact: true }).click()
  await expect(page.getByRole("heading", { name: "Log in", exact: true })).toBeVisible()
  await expect(page.getByLabel("ATProto handle")).toBeVisible()
  await expect(page.getByRole("button", { name: "Continue with ATProto" })).toBeDisabled()
  expect(errors).toEqual([])
})

test("the same-origin proxy returns typed unauthenticated API responses", async ({ request }) => {
  for (const path of ["/api/v1/session", "/api/v1/files"]) {
    const response = await request.get(path)
    expect(response.status()).toBe(401)
    expect(response.headers()["content-type"]).toContain("application/json")
    expect(await response.json()).toMatchObject({ code: "LoginRequired" })
  }
})

test("a PDS capability error stays visible and allows retry", async ({ page }) => {
  await page.route("**/oauth/login", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        code: "SpacesUnavailable",
        message: "This PDS does not support private Spaces.",
      }),
    }),
  )
  await page.goto("/login")
  await page.getByLabel("ATProto handle").fill("alice.example.com")
  await page.getByRole("button", { name: "Continue with ATProto" }).click()
  await expect(page.getByRole("alert")).toHaveText("This PDS does not support private Spaces.")
  await expect(page.getByRole("button", { name: "Continue with ATProto" })).toBeEnabled()
})

test("login is usable at a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/login")
  await expect(page.getByLabel("ATProto handle")).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  )
})
