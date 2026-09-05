import { fileItem } from "./fixtures"
import { expect, test } from "@playwright/test"
import { mockAccount } from "./fixtures"

test.use({ viewport: { width: 1440, height: 1000 } })

for (const colorScheme of ["light", "dark"] as const) {
  test(`${colorScheme} original menus render in a portal with translucent styling`, async ({
    page,
  }) => {
    await mockAccount(page)
    await page.emulateMedia({ colorScheme })
    await page.goto("/files")
    await page.getByLabel("Sort files", { exact: true }).click()
    const menu = page.locator(".popover-menu")
    await expect(menu).toBeVisible()
    expect(await menu.evaluate((node) => node.parentElement === document.body)).toBe(true)
    await expect(menu).toHaveCSS("width", "192px")
    await expect(menu).toHaveCSS("backdrop-filter", "blur(16px)")
    await expect(menu).toHaveCSS("transition-duration", "0.15s")
    await expect(menu).toHaveCSS("opacity", "1")
    const alpha = await menu.evaluate((node) => getComputedStyle(node).backgroundColor)
    expect(alpha).toContain(colorScheme === "dark" ? "0.5" : "0.4")
    await page.locator(".popover-menu").getByText("Size", { exact: true }).hover()
    await expect(page.locator(".popover-menu").getByText("Size", { exact: true })).toHaveCSS(
      "color",
      "rgb(255, 255, 255)",
    )
    await page.getByRole("heading", { name: "Files", exact: true }).click()
    await expect(menu).toHaveCount(0)
    await page.getByLabel("Sort files", { exact: true }).click()
    await page.getByRole("heading", { name: "Files", exact: true }).click()
    await expect(menu).toHaveCount(0)
  })
}

test("right-click selects the target, keeps multi-selection, and restores the inspector animation", async ({
  page,
}) => {
  await mockAccount(page)
  await page.goto("/files")
  const readme = fileItem(page, "Readme.txt")
  const photo = fileItem(page, "Vacation.jpg")
  await readme.click({ button: "right" })
  await expect(readme).toHaveClass(/bg-orange-500/)
  await expect(page.locator(".popover-menu").getByText("Delete", { exact: true })).toBeVisible()
  await expect(page.locator(".popover-menu").getByText(/Trash|Restore/)).toHaveCount(0)
  await page.locator(".popover-menu").getByText("Inspect", { exact: true }).click()
  const inspector = page.getByRole("complementary")
  await expect(inspector).toHaveCSS("width", "320px")
  await expect(inspector).toHaveCSS("transition-duration", "0.3s")
  await photo.click({ modifiers: ["Meta"] })
  await photo.click({ button: "right" })
  await expect(readme).toHaveClass(/bg-orange-500/)
  await expect(photo).toHaveClass(/bg-orange-500/)
  await inspector.getByRole("heading", { name: "Inspector", exact: true }).click()
  await expect(inspector).toContainText("1 / 2")
  await inspector.getByRole("button").nth(2).click()
  await expect(inspector).toContainText("Vacation.jpg")
  await inspector.getByRole("button").first().click()
  await expect(page.locator("#file-inspector")).toHaveCSS("width", "0px")
  await expect(page.locator("#file-inspector")).toHaveCSS("opacity", "0")
})

test("grid icons retain original 64px geometry and context menus stay inside the viewport", async ({
  page,
}) => {
  await mockAccount(page)
  await page.goto("/files")
  await page.getByRole("button", { name: "Grid view" }).click()
  const folder = fileItem(page, "Documents")
  await expect(folder.locator(".file-icon-pad")).toHaveCSS("width", "96px")
  await expect(folder.locator("svg")).toHaveCSS("width", "64px")
  await expect(folder.locator("svg")).toHaveCSS("height", "64px")
  await page.setViewportSize({ width: 390, height: 844 })
  await folder.click({ button: "right" })
  const menu = page.locator(".popover-menu")
  await expect(menu).toHaveCSS("opacity", "1")
  const bounds = await menu.boundingBox()
  expect(bounds!.x).toBeGreaterThanOrEqual(0)
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390)
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(844)
  await page.screenshot({ path: "/tmp/crate-restored-menu.png" })
})

test("the restored inline rename writes the selected record and Escape cancels", async ({
  page,
}) => {
  await mockAccount(page)
  const { files } = await import("./fixtures")
  let entries = [...files]
  const writes: unknown[] = []
  await page.route(/\/api\/v1\/files(?:\?.*)?$/, (route) =>
    route.fulfill({ json: { files: entries } }),
  )
  await page.route("**/api/v1/files/3mab4e5f6g7h3", (route) => {
    const body = route.request().postDataJSON()
    writes.push(body)
    entries = entries.map((file) =>
      file.id === "3mab4e5f6g7h3" ? { ...file, name: body.name } : file,
    )
    return route.fulfill({ json: entries.find((file) => file.id === "3mab4e5f6g7h3") })
  })
  await page.goto("/files")
  await page.getByRole("button", { name: "Grid view" }).click()
  await fileItem(page, "Readme.txt").click({ button: "right" })
  await page.locator(".popover-menu").getByText("Rename", { exact: true }).click()
  await page.locator(".file-grid input").fill("Cancelled.txt")
  await page.keyboard.press("Escape")
  expect(writes).toHaveLength(0)
  await expect(fileItem(page, "Readme.txt")).toBeVisible()
  await fileItem(page, "Readme.txt").click({ button: "right" })
  await page.locator(".popover-menu").getByText("Rename", { exact: true }).click()
  await page.locator(".file-grid input").fill("Renamed.txt")
  await page.keyboard.press("Enter")
  await expect(fileItem(page, "Renamed.txt")).toBeVisible()
  expect(writes).toEqual([{ name: "Renamed.txt", revision: "fixture-revision-3mab4e5f6g7h3" }])
})

for (const view of ["Grid", "List"] as const) {
  test(`${view} items own their menus and preserve selection across menu and inspector clicks`, async ({
    page,
  }) => {
    await mockAccount(page)
    await page.goto("/files")
    await page.getByRole("button", { name: `${view} view` }).click()
    const readme = fileItem(page, "Readme.txt")
    const photo = fileItem(page, "Vacation.jpg")
    const readmeSelection = view === "Grid" ? readme.locator(".file-label") : readme
    const photoSelection = view === "Grid" ? photo.locator(".file-label") : photo
    await readme.click()
    await photo.click()
    await expect(readmeSelection).not.toHaveClass(/bg-orange-500/)
    await expect(photoSelection).toHaveClass(/bg-orange-500/)
    await readme.click({ modifiers: ["Meta"] })
    await readme.click({ button: "right" })
    await expect(page.locator(".popover-menu")).toHaveCount(1)
    await page.locator(".popover-menu").getByText("Inspect", { exact: true }).click()
    await expect(page.locator("#file-inspector")).toContainText("1 / 2")
    await page.locator("#file-inspector button").nth(2).click()
    await expect(readmeSelection).toHaveClass(/bg-orange-500/)
    await expect(photoSelection).toHaveClass(/bg-orange-500/)
    await page.getByRole("heading", { name: "Files", exact: true }).click()
    await expect(readmeSelection).not.toHaveClass(/bg-orange-500/)
    await expect(photoSelection).not.toHaveClass(/bg-orange-500/)
  })
}
